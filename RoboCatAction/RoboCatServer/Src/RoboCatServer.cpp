#include <RoboCatServerPCH.h>

RoboCatServer::RoboCatServer() :
	mCatControlType( ESCT_Human ),
	mTimeOfNextShot( 0.f ),
	mTimeBetweenShots( 0.2f )
{}

void RoboCatServer::HandleDying()
{
	NetworkManagerServer::sInstance->UnregisterGameObject( this );
}

void RoboCatServer::Update()
{
	RoboCat::Update();
	
	Vector3 oldLocation = GetLocation();
	Vector3 oldVelocity = GetVelocity();
	float oldRotation = GetRotation();

	//are you controlled by a player?
	//if so, is there a move we haven't processed yet?
	if( mCatControlType == ESCT_Human )
	{
		ClientProxyPtr client = NetworkManagerServer::sInstance->GetClientProxy( GetPlayerId() );
		if( client )
		{
			MoveList& moveList = client->GetUnprocessedMoveList();
			for( const Move& unprocessedMove : moveList )
			{
				const InputState& currentState = unprocessedMove.GetInputState();

				float deltaTime = unprocessedMove.GetDeltaTime();

				ProcessInput( deltaTime, currentState );
				SimulateMovement( deltaTime );

				//LOG( "Server Move Time: %3.4f deltaTime: %3.4f left rot at %3.4f", unprocessedMove.GetTimestamp(), deltaTime, GetRotation() );

				client->GetProcessedMoveList().AddMove(unprocessedMove);
			}

			moveList.Clear();
		}
	}
	else
	{
		//do some AI stuff
		SimulateMovement( Timing::sInstance.GetDeltaTime() );
	}

	HandleShooting();

	if( !RoboMath::Is2DVectorEqual( oldLocation, GetLocation() ) ||
		!RoboMath::Is2DVectorEqual( oldVelocity, GetVelocity() ) ||
		oldRotation != GetRotation() )
	{
		NetworkManagerServer::sInstance->SetStateDirty( GetNetworkId(), ECRS_Pose );
	}

}

void RoboCatServer::ProcessInput( float inDeltaTime, const InputState& inInputState )
{
	RoboCat::ProcessInput( inDeltaTime, inInputState );

	if (mIsHyperShooting)
	{
		ClientProxyPtr proxy = NetworkManagerServer::sInstance->GetClientProxy(GetPlayerId());

		if (proxy && proxy->GetLastHyperYarnShotTime() + HyperYarn::sCooldown <= Timing::sInstance.GetTimef())
		{
			OutputMemoryBitStream out;
			out.Write(NetworkManager::kHyperYarnCC);

			std::shared_ptr<HyperYarn> hyperYarn = std::shared_ptr<HyperYarn>(new HyperYarn);
			Vector3 ray(GetForwardVector() * 100);
			hyperYarn->setPoints(GetLocation(), GetLocation() + ray);
			proxy->SetLastHyperYarnShotTime(Timing::sInstance.GetTimef());

			bool intersects = false;

			for (auto& object : World::sInstance->GetGameObjects())
			{
				RoboCat* cat = object->GetAsCat();
				if (cat && cat->GetPlayerId() != GetPlayerId())
				{
					// Rollback
					ClientProxyPtr other = NetworkManagerServer::sInstance->GetClientProxy(cat->GetPlayerId());
					
					if (other)
					{
						//inInputState.
					}

					intersects = hyperYarn->Intersects(std::static_pointer_cast<RoboCat>(object));

					// Re-apply moves
					if (other)
					{

					}

					if (intersects)
						break;
				}
			}

			out.Write(intersects);
			NetworkManagerServer::sInstance->SendPacket(out, proxy->GetSocketAddress());
		}
	}
}

void RoboCatServer::HandleShooting()
{
	float time = Timing::sInstance.GetFrameStartTime();
	if( mIsShooting && Timing::sInstance.GetFrameStartTime() > mTimeOfNextShot )
	{
		//not exact, but okay
		mTimeOfNextShot = time + mTimeBetweenShots;

		//fire!
		YarnPtr yarn = std::static_pointer_cast< Yarn >( GameObjectRegistry::sInstance->CreateGameObject( 'YARN' ) );
		yarn->InitFromShooter( this );
	}
}

void RoboCatServer::TakeDamage( int inDamagingPlayerId )
{
	mHealth--;
	if( mHealth <= 0.f )
	{
		//score one for damaging player...
		ScoreBoardManager::sInstance->IncScore( inDamagingPlayerId, 1 );

		//and you want to die
		SetDoesWantToDie( true );

		//tell the client proxy to make you a new cat
		ClientProxyPtr clientProxy = NetworkManagerServer::sInstance->GetClientProxy( GetPlayerId() );
		if( clientProxy )
		{
			clientProxy->HandleCatDied();
		}
	}

	//tell the world our health dropped
	NetworkManagerServer::sInstance->SetStateDirty( GetNetworkId(), ECRS_Health );
}

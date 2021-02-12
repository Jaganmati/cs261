#include <RoboCatPCH.h>
#include <time.h>

std::unique_ptr< Engine >	Engine::sInstance;

Engine::Engine() : mShouldKeepRunning( true )
{
	SocketUtil::StaticInit();

	srand( static_cast< uint32_t >( time( nullptr ) ) );
	
	GameObjectRegistry::StaticInit();


	World::StaticInit();

	ScoreBoardManager::StaticInit();
}

Engine::~Engine()
{
	SocketUtil::CleanUp();
}

int Engine::Run()
{
	return DoRunLoop();
}

int Engine::DoRunLoop()
{
	while( mShouldKeepRunning )
	{
		Timing::sInstance.Update();

		DoFrame();
	}

	return 0;
}

void Engine::DoFrame()
{
	World::sInstance->Update();
}

	

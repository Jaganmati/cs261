

/*
* the world tracks all the live game objects. Failry inefficient for now, but not that much of a problem
*/
class World
{

public:

	static void StaticInit();

	static std::unique_ptr< World >		sInstance;

	void AddGameObject( GameObjectPtr inGameObject );
	void RemoveGameObject( GameObjectPtr inGameObject );

	void AddHyperYarn( std::shared_ptr<HyperYarn> yarn );
	void RemoveHyperYarn( HyperYarn const& yarn );

	void Update();

	const std::vector< GameObjectPtr >&	GetGameObjects()	const	{ return mGameObjects; }

	const std::vector< std::shared_ptr<HyperYarn> > GetHyperYarn() const { return mHyperYarn; }

private:


	World();

	int	GetIndexOfGameObject( GameObjectPtr inGameObject );

	std::vector< GameObjectPtr >	mGameObjects;

	std::vector < std::shared_ptr<HyperYarn> > mHyperYarn;


};
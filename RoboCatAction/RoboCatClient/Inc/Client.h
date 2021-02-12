class Client : public Engine
{
public:

	static bool StaticInit( );

protected:

	Client();

	virtual void	DoFrame() override;
	void	HandleEvent( SDL_Event* inEvent );

private:



};

#include <RoboCatClientPCH.h>
#include "cpprest//base_uri.h"
#include "cpprest/http_client.h"
#include "cpprest/json.h"

bool Client::StaticInit( )
{
	// Create the Client pointer first because it initializes SDL
	Client* client = new Client();

	if( WindowManager::StaticInit() == false )
	{
		return false;
	}
	
	if( GraphicsDriver::StaticInit( WindowManager::sInstance->GetMainWindow() ) == false )
	{
		return false;
	}

	TextureManager::StaticInit();
	RenderManager::StaticInit();
	InputManager::StaticInit();

	HUD::StaticInit();

	sInstance.reset( client );

	return true;
}

Client::Client()
{
	GameObjectRegistry::sInstance->RegisterCreationFunction( 'RCAT', RoboCatClient::StaticCreate );
	GameObjectRegistry::sInstance->RegisterCreationFunction( 'MOUS', MouseClient::StaticCreate );
	GameObjectRegistry::sInstance->RegisterCreationFunction( 'YARN', YarnClient::StaticCreate );

	string destination = StringUtils::GetCommandLineArg( 1 );
	string username = StringUtils::GetCommandLineArg( 2 );
	string password = StringUtils::GetCommandLineArg( 3 );

	try
	{
		web::uri uri = web::uri(std::wstring(destination.begin(), destination.end()));
		web::http::client::http_client http = web::http::client::http_client(uri);

		web::http::http_request request;
		web::json::value loginBody;
		loginBody[L"username"] = web::json::value::string(std::wstring(username.begin(), username.end()));
		loginBody[L"password"] = web::json::value::string(std::wstring(password.begin(), password.end()));
		request.set_request_uri(web::uri(L"/api/v1/users/login"));
		request.set_method(web::http::methods::POST);
		request.set_body(loginBody);

		pplx::task<web::http::http_response> req = http.request(request);
		web::http::http_response loginResponse = req.get();

		if (loginResponse.status_code() == 200)
		{
			web::json::value result = loginResponse.extract_json().get();

			if (result[L"status"].as_string() == L"fail")
			{
				std::wstring reason = result[L"reason"].as_string();
				std::cerr << "Failed to login: " << std::string(reason.begin(), reason.end()) << std::endl;
				return;
			}

			auto& data = result[L"data"];
			if (!data.has_field(L"session"))
			{
				std::cerr << "Failed to login: Session ID not found in result from server." << std::endl;
				return;
			}

			if (!data.has_field(L"token"))
			{
				std::cerr << "Failed to login: Authentication token not found in result from server." << std::endl;
				return;
			}

			web::json::value& session = data[L"session"];
			web::json::value& token = data[L"token"];

			web::json::value connectBody;
			connectBody[L"_session"] = web::json::value::string(session.as_string());
			connectBody[L"_token"] = web::json::value::string(token.as_string());
			
			request.set_request_uri(web::uri(L"/api/v1/game/connect"));
			request.set_method(web::http::methods::POST);
			request.set_body(connectBody);

			web::http::http_response connectResponse = http.request(request).get();

			if (connectResponse.status_code() == 200)
			{
				web::json::value cResult = connectResponse.extract_json().get();

				if (cResult[L"status"].as_string() == L"fail")
				{
					std::wstring reason = cResult[L"reason"].as_string();
					std::cerr << "Failed to connect: " << std::string(reason.begin(), reason.end()) << std::endl;
					return;
				}

				auto& userData = cResult[L"data"];

				if (!userData.has_field(L"username"))
				{
					std::cerr << "Failed to connect: Username not found in result from server." << std::endl;
					return;
				}

				if (!userData.has_field(L"server"))
				{
					std::cerr << "Failed to login: IP address not found in result from server." << std::endl;
					return;
				}

				if (!userData.has_field(L"token"))
				{
					std::cerr << "Failed to login: Login token not found in result from server." << std::endl;
					return;
				}

				std::wstring id = userData[L"id"].as_string();
				std::wstring name = userData[L"username"].as_string();
				std::wstring avatar = userData[L"avatar"].is_string() ? userData[L"avatar"].as_string() : L"";
				std::wstring server = userData[L"server"].as_string();
				std::wstring loginToken = userData[L"token"].as_string();

				SocketAddressPtr serverAddress = SocketAddressFactory::CreateIPv4FromString(std::string(server.begin(), server.end()));

				NetworkManagerClient::StaticInit(*serverAddress, std::string(id.begin(), id.end()), std::string(name.begin(), name.end()), std::string(avatar.begin(), avatar.end()), std::string(loginToken.begin(), loginToken.end()));

				//NetworkManagerClient::sInstance->SetDropPacketChance( 0.6f );
				//NetworkManagerClient::sInstance->SetSimulatedLatency( 0.25f );
				//NetworkManagerClient::sInstance->SetSimulatedLatency( 0.5f );
				//NetworkManagerClient::sInstance->SetSimulatedLatency( 0.1f );
			}
			else
			{
				std::wstring reason = connectResponse.reason_phrase();
				std::cerr << std::string(reason.begin(), reason.end()) << std::endl;
			}
		}
		else
		{
			std::wstring reason = loginResponse.reason_phrase();
			std::cerr << std::string(reason.begin(), reason.end()) << std::endl;
		}
	}
	catch (std::exception const& e)
	{
		const char* error = e.what();
		std::cerr << "An exception occurred: " << error << std::endl;
	}
}



void Client::DoFrame()
{
	InputManager::sInstance->Update();

	Engine::DoFrame();

	if (NetworkManagerClient::sInstance)
		NetworkManagerClient::sInstance->ProcessIncomingPackets();

	RenderManager::sInstance->Render();

	if (NetworkManagerClient::sInstance)
		NetworkManagerClient::sInstance->SendOutgoingPackets();
}

void Client::HandleEvent( SDL_Event* inEvent )
{
	switch( inEvent->type )
	{
	case SDL_KEYDOWN:
		InputManager::sInstance->HandleInput( EIA_Pressed, inEvent->key.keysym.sym );
		break;
	case SDL_KEYUP:
		InputManager::sInstance->HandleInput( EIA_Released, inEvent->key.keysym.sym );
		break;
	default:
		break;
	}
}


#include <RoboCatClientPCH.h>
#include <SDL_render.h>

#include "HyperYarnClient.h"

void HyperYarnClient::Update()
{
	if (mCooldown > 0.0f)
	{
		float deltaTime = Timing::sInstance.GetDeltaTime();

		if ((mCooldown -= deltaTime) <= 0.0f)
		{
			mActive = false;
		}
	}
}

void HyperYarnClient::Read(InputMemoryBitStream& inInputStream)
{
	inInputStream.Read(mId);
	inInputStream.Read(mRotation);
	inInputStream.Read(mOrigin);
	inInputStream.Read(mHitPoint);
	inInputStream.Read(mColor);
	inInputStream.Read(mCooldown);
	inInputStream.Read(mActive);
}

void HyperYarnClient::Draw(const SDL_Rect& inViewTransform)
{
	if (mActive)
	{
		SDL_Renderer* renderer = GraphicsDriver::sInstance->GetRenderer();

		int originX = static_cast<int>(mOrigin.mX * inViewTransform.w + inViewTransform.x);
		int originY = static_cast<int>(mOrigin.mY * inViewTransform.h + inViewTransform.y);
		int hitX = static_cast<int>(mHitPoint.mX * inViewTransform.w + inViewTransform.x);
		int hitY = static_cast<int>(mHitPoint.mY * inViewTransform.h + inViewTransform.y);

		uint8_t r, g, b, a;
		SDL_GetRenderDrawColor(renderer, &r, &g, &b, &a);
		SDL_SetRenderDrawColor(renderer, static_cast<uint8_t>(mColor.mX * 255), static_cast<uint8_t>(mColor.mY * 255), static_cast<uint8_t>(mColor.mZ * 255), SDL_ALPHA_OPAQUE);
		SDL_RenderDrawLine(renderer, originX, originY, hitX, hitY);
		SDL_SetRenderDrawColor(renderer, r, g, b, a);
	}
}

/*bool HyperYarnClient::HandleCollisionWithCat(RoboCat* inCat)
{
	return false;
}*/
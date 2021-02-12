#include <RoboCatPCH.h>

float HyperYarn::sCooldown = 2.0f;
int HyperYarn::sNextId = 1;

HyperYarn::HyperYarn(HyperYarn const& rhs) : mId(rhs.mId), mRotation(rhs.mRotation), mCooldown(rhs.mCooldown), mActive(rhs.mActive)
{
	mOrigin.Set(rhs.mOrigin.mX, rhs.mOrigin.mY, rhs.mOrigin.mZ);
	mHitPoint.Set(rhs.mHitPoint.mX, rhs.mHitPoint.mY, rhs.mHitPoint.mZ);
	mColor.Set(rhs.mColor.mX, rhs.mColor.mY, rhs.mColor.mZ);
}

uint32_t HyperYarn::Write(OutputMemoryBitStream& inOutputStream, uint32_t inDirtyState) const
{
	inOutputStream.Write(mId);
	inOutputStream.Write(mRotation);
	inOutputStream.Write(mOrigin);
	inOutputStream.Write(mHitPoint);
	inOutputStream.Write(mColor);
	inOutputStream.Write(mCooldown);
	inOutputStream.Write(mActive);
	inOutputStream.Write(mEvaluated);

	return 0;
}

void HyperYarn::Update() {}

void HyperYarn::Draw(const SDL_Rect&) {}

bool HyperYarn::Intersects(RoboCatPtr cat)
{
	if (cat)
	{
		Vector3 const& loc = cat->GetLocation();
		float radiusSq = cat->GetCollisionRadius() * cat->GetCollisionRadius();
		Vector3 ray = mHitPoint - mOrigin;
		Vector3 offset = loc - mOrigin;
		Vector3 projected = ((offset.mX * ray.mX + offset.mY * ray.mY) / (ray.mX * ray.mX + ray.mY * ray.mY)) * ray;

		if (projected.LengthSq2D() <= ray.LengthSq2D())
		{
			Vector3 distVec = offset - projected;
			return distVec.LengthSq2D() <= radiusSq;
		}
	}

	return false;
}

void HyperYarn::setPoints(Vector3 const& origin, Vector3 const& hit)
{
	mOrigin.Set(origin.mX, origin.mY, origin.mZ);
	mHitPoint.Set(hit.mX, hit.mY, hit.mZ);
}

void HyperYarn::setColor(float red, float green, float blue)
{
	mColor.Set(red, green, blue);
}

bool HyperYarn::isActive() const
{
	return mActive;
}

int const& HyperYarn::getId() const
{
	return mId;
}
#pragma once

struct SDL_Rect;

class HyperYarn
{
	public:
		static float sCooldown;

		HyperYarn() = default;

		HyperYarn(HyperYarn const& rhs);

		virtual uint32_t Write(OutputMemoryBitStream& inOutputStream, uint32_t inDirtyState) const;

		virtual void Update();

		virtual void Draw(const SDL_Rect& inViewTransform);

		bool Intersects(RoboCatPtr cat);

		void setPoints(Vector3 const& origin, Vector3 const& hit);

		void setColor(float red, float green, float blue);

		bool isActive() const;

		int const& getId() const;

	protected:
		static int sNextId;
		int mId = sNextId++;
		Quaternion mRotation;
		Vector3 mOrigin;
		Vector3 mHitPoint;
		Vector3 mColor = Vector3(0, 0, 1);
		float mCooldown = sCooldown;
		bool mActive = true;
		bool mEvaluated = false;
};
#pragma once

#include "HyperYarn.h"

class HyperYarnClient : public HyperYarn
{
	public:
		virtual void Update();

		virtual void Read(InputMemoryBitStream& inInputStream);

		virtual void Draw(const SDL_Rect& inViewTransform);
};
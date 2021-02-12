# Macros ========================================

CC=g++

CFLAGS=-Wno-multichar -std=c++14 -O3
EXTRAFLAGS=-lpthread -lcrypto -static-libgcc
INCLUDES=-I./include
SOURCE=src/
OUTDIR=

ERASE=rm
OBJECTS=$(SOURCE)AckRange.cpp \
		$(SOURCE)ClientProxy.cpp \
		$(SOURCE)DeliveryNotificationManager.cpp \
		$(SOURCE)Engine.cpp \
		$(SOURCE)GameObject.cpp \
		$(SOURCE)GameObjectRegistry.cpp \
		$(SOURCE)HyperYarn.cpp \
		$(SOURCE)InFlightPacket.cpp \
		$(SOURCE)InputState.cpp \
		$(SOURCE)MemoryBitStream.cpp \
		$(SOURCE)Mouse.cpp \
		$(SOURCE)MouseServer.cpp \
		$(SOURCE)Move.cpp \
		$(SOURCE)MoveList.cpp \
		$(SOURCE)NetworkManager.cpp \
		$(SOURCE)NetworkManagerServer.cpp \
		$(SOURCE)ReplicationManagerServer.cpp \
		$(SOURCE)ReplicationManagerTransmissionData.cpp \
		$(SOURCE)RoboCat.cpp \
		$(SOURCE)RoboCatPCH.cpp \
		$(SOURCE)RoboCatServer.cpp \
		$(SOURCE)RoboCatServerPCH.cpp \
		$(SOURCE)RoboMath.cpp \
		$(SOURCE)ScoreBoardManager.cpp \
		$(SOURCE)Server.cpp \
		$(SOURCE)ServerMain.cpp \
		$(SOURCE)SocketAddress.cpp \
		$(SOURCE)SocketAddressFactory.cpp \
		$(SOURCE)SocketUtil.cpp \
		$(SOURCE)StringUtils.cpp \
		$(SOURCE)TCPSocket.cpp \
		$(SOURCE)Timing.cpp \
		$(SOURCE)UDPSocket.cpp \
		$(SOURCE)World.cpp \
		$(SOURCE)Yarn.cpp \
		$(SOURCE)YarnServer.cpp
EXE=server

# Targets ========================================

$(OUTDIR)$(EXE) :
	$(CC) -o $(OUTDIR)$(EXE) $(INCLUDES) $(CFLAGS) $(EXTRAFLAGS) $(OBJECTS)

clean :
	-$(ERASE) $(OUTDIR)$(EXE)
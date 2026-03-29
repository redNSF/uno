import { useStore } from './game/store'
import { MainMenu } from './ui/MainMenu'
import { SoloLobby } from './ui/SoloLobby'
import { PartyLobby } from './ui/PartyLobby'
import { Scene } from './three/Scene'
import { HUD } from './ui/HUD'
import { UnoButton } from './ui/UnoButton'
import { ColorPicker } from './ui/ColorPicker'
import { Toast } from './ui/Toast'
import { ChatPanel } from './ui/ChatPanel'
import { WinScreen } from './ui/WinScreen'
import { SpectatorMode } from './ui/SpectatorMode'

export default function App() {
  const route = useStore(s => s.ui.route)
  const isOnline = useStore(s => s.party.isOnline)

  return (
    <div id="app-root">
      {/* Global toast layer */}
      <Toast />

      {/* Routes */}
      {route === 'mainmenu' && <MainMenu />}
      {route === 'solo-lobby' && <SoloLobby />}
      {route === 'party-lobby' && <PartyLobby />}

      {/* Game view */}
      {route === 'game' && (
        <div id="game-view">
          {/* 3D Canvas fills the screen */}
          <div id="canvas-container">
            <Scene />
          </div>

          {/* HTML overlays on top of 3D */}
          <HUD />
          <UnoButton />
          <ColorPicker />
          <WinScreen />
          <SpectatorMode />

          {/* Party mode only */}
          {isOnline && <ChatPanel />}
        </div>
      )}
    </div>
  )
}

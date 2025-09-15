/**
 * App.tsx
 * 应用路由入口：定义首页与各小游戏页面的路由。
 */

import { HashRouter, Route, Routes } from 'react-router'
import HomePage from './pages/Home'
import TetrisPage from './pages/games/Tetris'
import SnakePage from './pages/games/Snake'
import TanksPage from './pages/games/Tanks'
import CardsPage from './pages/games/Cards'

/**
 * App
 * 定义 HashRouter 路由结构。
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tetris" element={<TetrisPage />} />
        <Route path="/snake" element={<SnakePage />} />
        <Route path="/tanks" element={<TanksPage />} />
        <Route path="/cards" element={<CardsPage />} />
      </Routes>
    </HashRouter>
  )
}

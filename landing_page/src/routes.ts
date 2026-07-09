import { createBrowserRouter } from 'react-router'
import Root from './layouts/Root'
import Home from './pages/Home'
import Layanan from './pages/Layanan'
import Simulasi from './pages/Simulasi'
import Keunggulan from './pages/Keunggulan'
import CaraPengajuan from './pages/CaraPengajuan'
import Career from './pages/Career'
import FAQ from './pages/FAQ'
import HubungiKami from './pages/HubungiKami'
import NotFound from './pages/NotFound'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'layanan', Component: Layanan },
      { path: 'simulasi', Component: Simulasi },
      { path: 'keunggulan', Component: Keunggulan },
      { path: 'cara-pengajuan', Component: CaraPengajuan },
      { path: 'career', Component: Career },
      { path: 'faq', Component: FAQ },
      { path: 'hubungi-kami', Component: HubungiKami },
      { path: '*', Component: NotFound },
    ],
  },
])

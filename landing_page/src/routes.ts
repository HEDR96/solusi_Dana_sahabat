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
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import NotFound from './pages/NotFound'
import KebijakanPrivasi from './pages/KebijakanPrivasi'

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
      { path: 'blog', Component: Blog },
      { path: 'blog/:slug', Component: BlogPost },
      { path: 'kebijakan-privasi', Component: KebijakanPrivasi },
      { path: '*', Component: NotFound },
    ],
  },
])

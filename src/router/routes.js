import Home from '@/views/Home.vue'
import NotebookView from '@/views/NotebookView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/notebook/:id',
    name: 'NotebookView',
    component: NotebookView
  },
  // Always leave this as last one,
  // but you can also remove it
  /* {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') }
    ]
  }, */
  {
    path: '*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes

export default defineNuxtRouteMiddleware((to, from) => {
  // Se tentar acessar página protegida sem estar logado, redireciona para login
  if (to.path !== '/login') {
    const user = localStorage.getItem('user')
    if (!user) {
      return navigateTo('/login')
    }
  }
  
  // Se já está logado e tenta acessar login, redireciona para home
  if (to.path === '/login') {
    const user = localStorage.getItem('user')
    if (user) {
      return navigateTo('/')
    }
  }
})
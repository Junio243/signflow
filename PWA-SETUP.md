# Configuração PWA do SignFlow

## ✅ O que já está configurado

- ✅ Manifest.json com metadados do app
- ✅ Next.js configurado com next-pwa
- ✅ Service Worker automático
- ✅ Metadata PWA no layout
- ✅ Cache strategy para Supabase e imagens

## 📋 Próximos passos

### 1. Instalar dependência

```bash
npm install next-pwa
```

### 2. Gerar ícones do app

Você precisa criar dois ícones PNG e colocá-los na pasta `public/`:

- `public/icon-192.png` (192x192 pixels)
- `public/icon-512.png` (512x512 pixels)

**Ferramentas gratuitas para gerar ícones:**

- [Favicon.io](https://favicon.io/) - Crie ícones a partir de texto, imagem ou emoji
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Gerador completo de ícones PWA
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator) - CLI para gerar todos os tamanhos

**Dica rápida:** Use um "S" estilizado ou o logo do SignFlow em fundo azul (#0066ff).

### 3. Testar o PWA

Após fazer deploy na Vercel:

1. Abra o site no Chrome/Edge do celular
2. Você verá um banner "Adicionar à tela inicial"
3. Clique e instale o app
4. O ícone aparecerá na tela inicial como app nativo

**Para testar localmente:**

```bash
npm run build
npm start
# Abra http://localhost:3000 no Chrome
# DevTools → Application → Manifest (verifique configurações)
# DevTools → Lighthouse → PWA (rode auditoria)
```

## 🎯 Funcionalidades PWA ativas

- **Instalável**: Usuários podem adicionar à tela inicial
- **Offline básico**: Cache de assets estáticos
- **Atalhos**: Acesso rápido para "Nova Assinatura" e "Meus Documentos"
- **Standalone**: Abre sem barra de navegação do browser
- **Cache inteligente**: 
  - API Supabase: NetworkFirst (tenta rede, fallback cache)
  - Imagens: CacheFirst (serve do cache, economiza dados)

## 🚀 Melhorias futuras

Após testar o básico, você pode adicionar:

- Push notifications quando link mágico chegar
- Modo offline completo (visualizar documentos já baixados)
- Background sync para upload quando conexão voltar
- Share target (receber PDFs de outros apps)

## 🔍 Validação

Para garantir que está tudo OK, rode:

```bash
npm run build
```

Deve ver mensagens do next-pwa:
```
✓ Compiled successfully
✓ Generating service worker
✓ Build optimization successful
```

## 📱 Compatibilidade

- ✅ Android Chrome/Edge
- ✅ iOS Safari 16.4+
- ✅ Desktop Chrome/Edge
- ⚠️ Firefox (instalação limitada)

---

**Dúvidas?** Consulte a [documentação oficial do next-pwa](https://github.com/shadowwalker/next-pwa)

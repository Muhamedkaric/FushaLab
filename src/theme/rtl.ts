import createCache from '@emotion/cache'
import stylisRTLPlugin from 'stylis-plugin-rtl'

export const rtlCache = createCache({
  key: 'muirtl',
  stylisPlugins: [stylisRTLPlugin],
})

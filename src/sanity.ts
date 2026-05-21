import {createClient} from '@sanity/client'

export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

import imageUrlBuilder from '@sanity/image-url'
const builder = imageUrlBuilder(sanityClient)
export const urlFor = (source: any) => builder.image(source)

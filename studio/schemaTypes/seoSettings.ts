import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'seoSettings',
  title: 'SEO Settings',
  type: 'document',
  fields: [
    defineField({name: 'metaTitle', title: 'Default Meta Title', type: 'string'}),
    defineField({name: 'metaDescription', title: 'Default Meta Description', type: 'text', rows: 3}),
    defineField({name: 'socialTitle', title: 'Default Social Title', type: 'string'}),
    defineField({name: 'socialDescription', title: 'Default Social Description', type: 'text', rows: 3}),
    defineField({
      name: 'openGraphImage',
      title: 'Default Open Graph Image',
      type: 'image',
      description: 'Recommended size: 1200×630px',
    }),
    defineField({
      name: 'noindex',
      title: 'Block search engines (noindex)',
      type: 'boolean',
      description: 'Turn ON to hide the site from Google. Use during development only.',
      initialValue: false,
    }),
  ],
})

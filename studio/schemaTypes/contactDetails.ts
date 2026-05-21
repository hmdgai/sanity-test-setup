import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'contactDetails',
  title: 'Contact Details',
  type: 'document',
  fields: [
    defineField({name: 'primaryEmail', title: 'Primary Email', type: 'string'}),
    defineField({name: 'primaryPhone', title: 'Primary Phone', type: 'string'}),
    defineField({name: 'whatsapp', title: 'WhatsApp Number', type: 'string'}),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        {name: 'facebook', title: 'Facebook URL', type: 'url'},
        {name: 'instagram', title: 'Instagram URL', type: 'url'},
        {name: 'twitter', title: 'X / Twitter URL', type: 'url'},
        {name: 'linkedin', title: 'LinkedIn URL', type: 'url'},
        {name: 'youtube', title: 'YouTube URL', type: 'url'},
        {name: 'tiktok', title: 'TikTok URL', type: 'url'},
      ],
    }),
  ],
})

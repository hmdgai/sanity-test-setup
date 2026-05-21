import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({name: 'question', title: 'Question', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'answer', title: 'Answer', type: 'text', rows: 5, validation: (r) => r.required()}),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Optional — for grouping FAQs together',
    }),
    defineField({name: 'order', title: 'Display Order', type: 'number'}),
  ],
  orderings: [
    {title: 'Display Order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'question', subtitle: 'category'},
  },
})

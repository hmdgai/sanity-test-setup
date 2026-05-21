import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'pricingItem',
  title: 'Pricing Item',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Service / Item Name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 2}),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'string',
      description: 'e.g. "£50", "From £100", "Contact for quote"',
    }),
    defineField({name: 'category', title: 'Category', type: 'string', description: 'Optional — for grouping'}),
    defineField({name: 'order', title: 'Display Order', type: 'number'}),
  ],
  orderings: [
    {title: 'Display Order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'name', subtitle: 'price'},
  },
})

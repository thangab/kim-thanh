type MenuItem = {
  label: string
  overridePrice?: string | null
  note?: string | null
  order: number
}

type MenuGroup = {
  title: string
  order: number
  items: MenuItem[]
}

type StructuredMenuSection = {
  title: string
  pricePrefix?: string | null
  basePrice?: string | null
  intro?: string | null
  layout: 'columns' | 'list' | 'notice'
  order: number
  priceNote?: string | null
  groups: MenuGroup[]
  items: MenuItem[]
}

type StructuredMenuQueryResponse = {
  data?: {
    menuSectionCollection?: {
      items?: Array<{
        title: string
        pricePrefix?: string | null
        basePrice?: string | null
        intro?: string | null
        layout: 'columns' | 'list' | 'notice'
        order: number
        priceNote?: string | null
        groupsCollection?: {
          items?: Array<{
            title: string
            order: number
            itemsCollection?: {
              items?: MenuItem[]
            }
          }>
        }
        itemsCollection?: {
          items?: MenuItem[]
        }
      }>
    }
  }
  errors?: Array<{ message: string }>
}

export type HomeMenuSection = StructuredMenuSection

async function fetchGraphQL<T>(query: string): Promise<T> {
  const spaceId = process.env.CONTENTFUL_SPACE_ID
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN

  if (!spaceId || !accessToken) {
    console.warn('Contentful environment variables are missing. Returning empty menu.')
    return {} as T
  }

  const response = await fetch(
    `https://graphql.contentful.com/content/v1/spaces/${spaceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query }),
      next: { tags: ['menu'] },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Contentful request failed with status ${response.status}: ${errorText}`
    )
  }

  return response.json()
}

function extractStructuredMenuSections(
  fetchResponse: StructuredMenuQueryResponse
): StructuredMenuSection[] {
  if (fetchResponse.errors?.length) {
    console.error(
      'Contentful structured menu query returned errors:',
      fetchResponse.errors.map((error) => error.message).join(', ')
    )
  }

  return (fetchResponse.data?.menuSectionCollection?.items ?? []).map((section) => ({
    title: section.title,
    pricePrefix: section.pricePrefix,
    basePrice: section.basePrice,
    intro: section.intro,
    layout: section.layout,
    order: section.order,
    priceNote: section.priceNote,
    groups: (section.groupsCollection?.items ?? []).map((group) => ({
      title: group.title,
      order: group.order,
      items: [...(group.itemsCollection?.items ?? [])].sort((a, b) => a.order - b.order),
    })),
    items: [...(section.itemsCollection?.items ?? [])].sort((a, b) => a.order - b.order),
  }))
}

export async function getMenu(): Promise<HomeMenuSection[]> {
  try {
    const structuredResponse = await fetchGraphQL<StructuredMenuQueryResponse>(
      `query {
        menuSectionCollection(order: order_ASC, limit: 20) {
          items {
            title
            pricePrefix
            basePrice
            intro
            layout
            order
            priceNote
            groupsCollection(limit: 10) {
              items {
                ... on MenuGroup {
                  title
                  order
                  itemsCollection(limit: 30) {
                    items {
                      ... on MenuItem {
                        label
                        overridePrice
                        note
                        order
                      }
                    }
                  }
                }
              }
            }
            itemsCollection(limit: 30) {
              items {
                ... on MenuItem {
                  label
                  overridePrice
                  note
                  order
                }
              }
            }
          }
        }
      }`
    )

    return extractStructuredMenuSections(structuredResponse).sort(
      (a, b) => a.order - b.order
    )
  } catch (error) {
    console.error('Unable to fetch menu from Contentful:', error)
    return []
  }
}

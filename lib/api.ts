import type { Document } from '@contentful/rich-text-types'

const POST_GRAPHQL_FIELDS = `
  name
  price
  order
  description {
    json
  }
`

type MenuEntry = {
  name: string
  price: string
  order: number
  description: {
    json: Document
  }
}

type MenuQueryResponse = {
  data?: {
    menuCollection?: {
      items?: MenuEntry[]
    }
  }
  errors?: Array<{ message: string }>
}

async function fetchGraphQL(query: string): Promise<MenuQueryResponse> {
  const spaceId = process.env.CONTENTFUL_SPACE_ID
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN

  if (!spaceId || !accessToken) {
    console.warn('Contentful environment variables are missing. Returning empty menu.')
    return {}
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
    throw new Error(`Contentful request failed with status ${response.status}`)
  }

  return response.json()
}

function extractMenuEntries(fetchResponse: MenuQueryResponse): MenuEntry[] {
  if (fetchResponse.errors?.length) {
    console.error(
      'Contentful GraphQL returned errors:',
      fetchResponse.errors.map((error) => error.message).join(', ')
    )
  }

  return fetchResponse.data?.menuCollection?.items ?? []
}

export async function getMenu(): Promise<MenuEntry[]> {
  try {
    const entries = await fetchGraphQL(
      `query {
        menuCollection(order: order_ASC)  {
          items {
            ${POST_GRAPHQL_FIELDS}
          }
        }
      }`
    )

    return extractMenuEntries(entries) ?? []
  } catch (error) {
    console.error('Unable to fetch menu from Contentful:', error)
    return []
  }
}

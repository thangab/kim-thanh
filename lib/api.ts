const POST_GRAPHQL_FIELDS = `
  name
  price
  order
  description {
    json
  }
`

async function fetchGraphQL(query: string): Promise<any> {
  return fetch(
    `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CONTENTFUL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query }),
      next: { tags: ['menu'] },
    }
  ).then((response) => response.json())
}

function extractMenuEntries(fetchResponse: any): any[] {
  return fetchResponse?.data?.menuCollection?.items
}

export async function getMenu(): Promise<any[]> {
  const entries = await fetchGraphQL(
    `query {
      menuCollection(order: order_ASC)  {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`
  )
  return extractMenuEntries(entries)
}

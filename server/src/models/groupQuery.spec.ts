import { buildOpenGroupsQuery, GROUP_LIMIT } from './groupQuery'

describe('buildOpenGroupsQuery', () => {
  const sql = buildOpenGroupsQuery()

  it('keeps the ORDER BY and LIMIT inside the same statement', () => {
    // A missing "+" between the string pieces once dropped both clauses silently
    expect(sql).toMatch(/HAVING COUNT\(DISTINCT t\.player_id\) < 20 ORDER BY p\.modified_on ASC, group_size ASC, p\.player_id ASC LIMIT 2$/)
  })

  it('only offers teams below the size limit', () => {
    expect(GROUP_LIMIT).toBe(20)
    expect(buildOpenGroupsQuery(5)).toContain('< 5 ORDER BY')
  })

  it('only considers teams, not players', () => {
    expect(sql).toContain('WHERE p.is_group = 1')
  })
})

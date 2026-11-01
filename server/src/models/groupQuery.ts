export const GROUP_LIMIT = 20

/**
 * Teams that can still take a new player: not full and without a finished album.
 * Sorted by the least recently assigned first, so new players alternate between
 * the two oldest teams. `modified_on` has one-second precision, so ties are
 * broken by the smaller team and then by id to keep the order deterministic.
 */
export function buildOpenGroupsQuery (groupLimit: number = GROUP_LIMIT): string {
  return 'SELECT DISTINCT p.player_id group_id, p.player_name group_name, p.modified_on, COUNT(DISTINCT t.player_id) group_size ' +
    'FROM player p ' +
    'LEFT JOIN album a ON a.player_id = p.player_id AND ended_on IS NOT NULL ' +
    'LEFT JOIN player t ON t.group_id = p.player_id AND t.is_group = 0 ' +
    'WHERE p.is_group = 1 ' +
    'AND a.player_id IS NULL ' +
    'GROUP BY p.player_name ' +
    'HAVING COUNT(DISTINCT t.player_id) < ' + Number(groupLimit) + ' ' +
    'ORDER BY p.modified_on ASC, group_size ASC, p.player_id ASC ' +
    'LIMIT 2'
}

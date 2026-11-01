import axios from 'axios'
import { Question } from './question'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

interface Thing extends Question.Identifiable {
    name: string
}

describe('DAO.push', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => { })
    })

    it('keeps every record when the API fails to save them', async () => {
        // e.g. the album was deleted, so the foreign key rejects each insert
        mockedAxios.post.mockRejectedValue(new Error('foreign key constraint fails'))
        const dao = new Question.DAO<Thing>('thing', [])

        await dao.push({ name: 'a' })
        await dao.push({ name: 'b' })
        await dao.push({ name: 'c' })

        expect(dao.db.map(t => t.name)).toEqual(['a', 'b', 'c'])
    })

    it('updates a saved record in place', async () => {
        mockedAxios.post.mockResolvedValue({ data: { thingId: 7 } })
        const dao = new Question.DAO<Thing>('thing', [])

        await dao.push({ name: 'first' })
        await dao.push({ id: 7, name: 'renamed' })

        expect(dao.db).toEqual([{ id: 7, name: 'renamed' }])
    })
})

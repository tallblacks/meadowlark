const { Pool } = require('pg')
const _ = require('lodash') // npm install lodash

const credentials = require('../credentials')
const env = process.env.NODE_ENV || "development"
const connectionString = credentials.postgresUri
const pool = new Pool({ connectionString })

module.exports = {
    getVacations: async () => {
        const { rows } = await pool.query('SELECT * FROM VACATIONS')
        return rows.map(row => {
            // 使用 _.mapKeys 函数将每一行的键转换为 camelCase。
            const vacation = _.mapKeys(row, (v, k) => _.camelCase(k))
            vacation.price = parseFloat(vacation.price.replace(/^\$/, ''))
            vacation.location = {
                search: vacation.locationSearch,
                coordinates: {
                    lat: vacation.locationLat,
                    lng: vacation.locationLng,
                },
            }
            return vacation
        })
    },
    addVacationInSeasonListener: async (email, sku) => {
      await pool.query(
        'INSERT INTO vacation_in_season_listeners (email, sku) ' +
        'VALUES ($1, $2) ' +
        'ON CONFLICT DO NOTHING',
        [email, sku]
      )
    },
}
const faunadb = require('faunadb');
const q = faunadb.query;

const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event, context) => {
  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  const { name, email, date, time, duration } = JSON.parse(event.body);

  if (!name || !email || !date || !time || !duration) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'All fields are required' })
    };
  }

  try {
    // Check availability
    const availabilityResult = await client.query(
      q.Count(
        q.Match(q.Index('bookings_by_date_time_duration'), [date, time, duration])
      )
    );

    if (availabilityResult >= 3) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No ATVs available for this time slot' })
      };
    }

    // Create booking
    const result = await client.query(
      q.Create(
        q.Collection('bookings'),
        {
          data: { name, email, date, time, duration }
        }
      )
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, id: result.ref.id })
    };
  } catch (error) {
    console.error('Booking error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create booking', details: error.message })
    };
  }
};
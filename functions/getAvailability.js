const faunadb = require('faunadb');
const q = faunadb.query;

const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

exports.handler = async (event, context) => {
  const { date } = event.queryStringParameters;
  
  if (!date) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Date parameter is required' })
    };
  }

  try {
    const result = await client.query(
      q.Map(
        q.Paginate(q.Match(q.Index('bookings_by_date'), date)),
        q.Lambda('booking', q.Get(q.Var('booking')))
      )
    );

    const bookings = result.data;
    const availability = calculateAvailability(bookings, date);

    return {
      statusCode: 200,
      body: JSON.stringify(availability)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch availability' })
    };
  }
};

function calculateAvailability(bookings, date) {
  // Implement your availability calculation logic here
  // This is a simplified example
  const availability = {};
  const startHour = 10;
  const endHour = 20;
  const totalATVs = 3;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const key15 = `${date}_${timeString}_15`;
      const key30 = `${date}_${timeString}_30`;
      
      const bookedATVs = bookings.filter(booking => 
        booking.data.date === date &&
        booking.data.time === timeString &&
        (booking.data.duration === '15' || booking.data.duration === '30')
      ).length;

      availability[key15] = totalATVs - bookedATVs;
      availability[key30] = totalATVs - bookedATVs;
    }
  }

  return availability;
}
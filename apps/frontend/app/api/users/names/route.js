import { connectDB } from "@/lib/mongodb";

export async function POST(req) {
  try {
    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds)) {
      return new Response(JSON.stringify({ error: 'Invalid userIds' }), { status: 400 });
    }

    const db = await connectDB();
    const users = await db
      .collection('users')
      .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
      .project({ _id: 1, name: 1 })
      .toArray();

    const userMap = users.reduce((map, user) => {
      map[user._id.toString()] = user.name || '';
      return map;
    }, {});

    return new Response(JSON.stringify({ userMap }), { status: 200 });
  } catch (error) {
    console.error('Error fetching user names:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}



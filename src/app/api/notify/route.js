export async function POST(request) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restApiKey) {
    return Response.json(
      { error: 'OneSignal belum dikonfigurasi di environment server.' },
      { status: 503 }
    );
  }

  try {
    const { title, category, url } = await request.json();

    if (!title) {
      return Response.json({ error: 'Judul berita wajib diisi.' }, { status: 400 });
    }

    const oneSignalResponse = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        Authorization: `Key ${restApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ['Total Subscriptions'],
        headings: { en: title, id: title },
        contents: {
          en: category ? `Berita baru: ${category}` : 'Ada berita baru dari BEM ITMS.',
          id: category ? `Berita baru: ${category}` : 'Ada berita baru dari BEM ITMS.'
        },
        url: url || process.env.NEXT_PUBLIC_SITE_URL || 'https://bemitms.my.id'
      })
    });

    const responseBody = await oneSignalResponse.json();

    if (!oneSignalResponse.ok) {
      console.error('OneSignal API error:', responseBody);
      return Response.json(
        { error: 'OneSignal gagal mengirim notifikasi.' },
        { status: 502 }
      );
    }

    return Response.json({ success: true, id: responseBody.id });
  } catch (error) {
    console.error('Notification route error:', error);
    return Response.json(
      { error: 'Terjadi kesalahan saat mengirim notifikasi.' },
      { status: 500 }
    );
  }
}

import pool from './database';

const news = [
  {
    headline: 'హైదరాబాద్‌లో మెట్రో రెండో దశ విస్తరణకు రాష్ట్ర కేబినెట్ ఆమోదం',
    summary:
      'నగర రవాణా వ్యవస్థను మరింత ఆధునీకరించేందుకు హైదరాబాద్ మెట్రో ఫేజ్-2 ప్రాజెక్టుకు రాష్ట్ర మంత్రివర్గం అధికారికంగా ఆమోదం తెలిపింది.',
    content:
      'నగర రవాణా వ్యవస్థను మరింత ఆధునీకరించేందుకు హైదరాబాద్ మెట్రో ఫేజ్-2 ప్రాజెక్టుకు రాష్ట్ర మంత్రివర్గం అధికారికంగా ఆమోదం తెలిపింది. శంషాబాద్ విమానాశ్రయం మరియు ఇతర కీలక రూట్లలో కొత్త కారిడార్ల నిర్మాణంతో ప్రయాణికులకు ట్రాఫిక్ కష్టాలు తగ్గనున్నాయి.',
    image_url:
      'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1000&q=80',
    source_name: 'మిడ్‌పాయింట్ న్యూస్',
    location: 'హైదరాబాద్',
    is_breaking: true,
    is_trending: true,
    read_count: 14200,
    like_count: 2450,
    comment_count: 184,
    share_count: 512,
  },
  {
    headline:
      'మేడ్చల్-మల్కాజిగిరి జిల్లాలో సరికొత్త ఐటీ హబ్ నిర్మాణ పనులు వేగవంతం',
    summary:
      'మేడ్చల్ పరిసర ప్రాంతాల్లో యువతకు స్థానికంగానే ఉపాధి అవకాశాలు కల్పించేందుకు ప్రభుత్వం ప్రతిపాదించిన ఐటీ పార్క్ ప్రాజెక్ట్ పనులు వేగంగా సాగుతున్నాయి.',
    content:
      'మేడ్చల్ పరిసర ప్రాంతాల్లో యువతకు స్థానికంగానే ఉపాధి అవకాశాలు కల్పించేందుకు ప్రభుత్వం ప్రతిపాదించిన ఐటీ పార్క్ ప్రాజెక్ట్ పనులు వేగంగా సాగుతున్నాయి. రాబోయే ఏడాదిలో మొదటి దశ పూర్తికానుందని అధికారులు వెల్లడించారు.',
    image_url:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&q=80',
    source_name: 'మిడ్‌పాయింట్ లోకల్',
    location: 'మేడ్చల్',
    is_breaking: false,
    is_trending: true,
    read_count: 8900,
    like_count: 1120,
    comment_count: 63,
    share_count: 230,
  },
  {
    headline:
      'భారతీయ ప్రాంతీయ భాషలను సులువుగా అనువదించే నూతన ఏఐ మోడల్ ఆవిష్కరణ',
    summary:
      'తెలుగుతో సహా 12 భారతీయ భాషలలో సహజ సంభాషణలను క్షణాల్లో అనువదించగల అత్యాధునిక ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ సాధనాన్ని పరిశోధకులు విడుదల చేశారు.',
    content:
      'తెలుగుతో సహా 12 భారతీయ భాషలలో సహజ సంభాషణలను క్షణాల్లో అనువదించగల అత్యాధునిక ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ సాధనాన్ని పరిశోధకులు విడుదల చేశారు. ఇది విద్య, పాలన మరియు గ్రామీణ డిజిటల్ సేవలలో ఉపయోగపడనుంది.',
    image_url:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1000&q=80',
    source_name: 'మిడ్‌పాయింట్ టెక్',
    location: 'బెంగళూరు',
    is_breaking: false,
    is_trending: true,
    read_count: 19500,
    like_count: 3840,
    comment_count: 295,
    share_count: 890,
  },
  {
    headline:
      'ఉప్పల్ స్టేడియంలో జరిగిన ఉత్కంఠ పోరులో భారత జట్టు సంచలన విజయం',
    summary:
      'చివరి ఓవర్ వరకు ఊపిరిబిగపట్టి సాగిన మ్యాచ్‌లో భారత యువ ఆటగాళ్ళు అద్భుత ప్రదర్శన కనబరిచి చిరస్మరణీయ విజయాన్ని సొంతం చేసుకున్నారు.',
    content:
      'చివరి ఓవర్ వరకు ఊపిరిబిగపట్టి సాగిన మ్యాచ్‌లో భారత యువ ఆటగాళ్ళు అద్భుత ప్రదర్శన కనబరిచి చిరస్మరణీయ విజయాన్ని సొంతం చేసుకున్నారు. హైదరాబాద్ క్రికెట్ అభిమానులు స్టేడియంలో సంబరాలు జరుపుకున్నారు.',
    image_url:
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1000&q=80',
    source_name: 'స్పోర్ట్స్ డెస్క్',
    location: 'హైదరాబాద్',
    is_breaking: true,
    is_trending: true,
    read_count: 31200,
    like_count: 7890,
    comment_count: 640,
    share_count: 1420,
  },
];

async function seedNews() {
  try {
    for (const article of news) {
      await pool.query(
        `
        INSERT INTO news_articles (
          headline,
          summary,
          content,
          image_url,
          source_name,
          location,
          status,
          is_breaking,
          is_trending,
          read_count,
          like_count,
          comment_count,
          share_count,
          published_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          'published',
          $7, $8, $9, $10, $11, $12,
          NOW()
        )
        `,
        [
          article.headline,
          article.summary,
          article.content,
          article.image_url,
          article.source_name,
          article.location,
          article.is_breaking,
          article.is_trending,
          article.read_count,
          article.like_count,
          article.comment_count,
          article.share_count,
        ],
      );
    }

    console.log(`✅ ${news.length} news articles inserted successfully.`);
  } catch (error) {
    console.error('❌ Failed to seed news:', error);
  } finally {
    await pool.end();
  }
}

seedNews();
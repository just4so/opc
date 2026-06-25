export const PARSE_PROMPT = `你是一个数据结构化专家。下面是一期「OPC Weekly Signal」活动的页面文本内容。

请将其解析为以下 JSON 结构，严格按照 schema 输出，不要加任何解释：

{
  "issueNo": <整数，期号>,
  "title": "<本期大标题>",
  "publishedAt": "<ISO日期，如 2026-06-25>",
  "activityTime": "<活动时间，如 12:00-13:00>",
  "intro": "<本期导读，多段合并为一段字符串，可为null>",
  "participants": [
    {"name":"<姓名>","city":"<城市>","roleLabel":"<身份描述>","roleType":"<host|speaker>"}
  ],
  "sections": [
    // 以下为各板块类型，按实际内容包含，没有的板块不要包含

    // 热词信号板块（type: "hot_topic"）
    {
      "type": "hot_topic",
      "slot": "<A|B|C 等槽位>",
      "title": "<板块标题>",
      "subtitle": "<副标题>",
      "intro": "<导读，可为null>",
      "points": [
        {"seq": 1, "heading": "<要点标题>", "body": "<要点内容>", "url": "<链接或null>"}
      ],
      "claim": "<一句话主张>",
      "observations": ["<观察点1>", "<观察点2>"],
      "opc_use": [
        {"role": "<技术人|决策者|投资者等>", "text": "<OPC应用说明>"}
      ]
    },

    // 政策波段板块（type: "policy"）
    {
      "type": "policy",
      "items": [
        {"ptype": "<国家级|地方|金融等>", "content": "<政策内容>", "impact": "<影响说明>", "url": "<链接或null>"}
      ]
    },

    // 实战信号板块（type: "cases"）
    {
      "type": "cases",
      "items": [
        {
          "title": "<案例标题>",
          "caseType": "<OPC实践|商业实践|社区政策|其他>",
          "name": "<分享人姓名>",
          "city": "<城市>",
          "roleLabel": "<身份描述>",
          "background": "<背景>",
          "action": "<行动>",
          "result": "<结果>",
          "advice": "<建议>",
          "contact": "<联系方式或null>"
        }
      ]
    },

    // 资源广播板块（type: "resources"）
    {
      "type": "resources",
      "items": [
        {
          "rtype": "<OPC社区|活动招募|项目合作|招聘兼职等>",
          "content": "<资源内容>",
          "publisher": "<发布人>",
          "url": "<链接或null>",
          "urlLabel": "<链接文字或null>"
        }
      ]
    },

    // 自定义板块（type: "custom"，兜底用于未知类型）
    {
      "type": "custom",
      "label": "<板块名称>",
      "content": "<板块内容>"
    }
  ]
}

注意：
1. 只输出 JSON，不要 markdown 代码块，不要解释
2. 主持人 roleType 为 host，分享人为 speaker
3. 如果姓名和昵称连在一起（如「糊糊 刘梦然」），拆分为两个独立参与者
4. 没有的板块不要包含在 sections 里
5. 链接用原始 URL，没有的填 null
6. 字符串内不要有换行符，用空格代替

页面内容：
{TEXT}`

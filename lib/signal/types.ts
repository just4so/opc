export type Participant = {
  name: string
  city: string
  roleLabel: string
  roleType: 'host' | 'speaker'
}

export type HotTopicSection = {
  type: 'hot_topic'
  slot: string
  title: string
  subtitle: string
  intro?: string
  points: Array<{
    seq: number
    heading: string
    body: string
    url: string | null
  }>
  claim: string
  observations: string[]
  opc_use: Array<{
    role: string
    text: string
  }>
}

export type PolicySection = {
  type: 'policy'
  items: Array<{
    ptype: string
    content: string
    impact: string
    url: string | null
  }>
}

export type CasesSection = {
  type: 'cases'
  items: Array<{
    title: string
    caseType: string
    name: string
    city: string
    roleLabel: string
    background: string
    action: string
    result: string
    advice: string
    contact: string | null
  }>
}

export type ResourcesSection = {
  type: 'resources'
  items: Array<{
    rtype: string
    content: string
    publisher: string
    url: string | null
    urlLabel: string | null
  }>
}

export type CustomSection = {
  type: 'custom'
  label: string
  content: string
}

export type Section =
  | HotTopicSection
  | PolicySection
  | CasesSection
  | ResourcesSection
  | CustomSection

export type SignalIssueData = {
  issueNo: number
  title: string
  publishedAt: string
  activityTime?: string | null
  intro?: string | null
  participants: Participant[]
  sections: Section[]
}

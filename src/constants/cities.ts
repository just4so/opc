export const CITIES = [
  { name: '深圳', province: '广东', count: 11 },
  { name: '杭州', province: '浙江', count: 4 },
  { name: '上海', province: '上海', count: 3 },
  { name: '常州', province: '江苏', count: 3 },
  { name: '北京', province: '北京', count: 2 },
  { name: '苏州', province: '江苏', count: 2 },
  { name: '无锡', province: '江苏', count: 2 },
  { name: '青岛', province: '山东', count: 2 },
  { name: '宁波', province: '浙江', count: 2 },
  { name: '南京', province: '江苏', count: 1 },
  { name: '武汉', province: '湖北', count: 1 },
  { name: '成都', province: '四川', count: 1 },
  { name: '昆山', province: '江苏', count: 1 },
  { name: '广州', province: '广东', count: 1 },
  { name: '厦门', province: '福建', count: 1 },
  { name: '福州', province: '福建', count: 1 },
] as const

export const HOT_CITIES = ['深圳', '杭州', '北京', '上海', '苏州', '常州', '无锡', '成都']

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  深圳: { lat: 22.5431, lng: 114.0579 },
  杭州: { lat: 30.2741, lng: 120.1551 },
  北京: { lat: 39.9042, lng: 116.4074 },
  上海: { lat: 31.2304, lng: 121.4737 },
  苏州: { lat: 31.2989, lng: 120.5853 },
  常州: { lat: 31.8112, lng: 119.9741 },
  无锡: { lat: 31.4912, lng: 120.3119 },
  成都: { lat: 30.5728, lng: 104.0668 },
  广州: { lat: 23.1291, lng: 113.2644 },
  南京: { lat: 32.0603, lng: 118.7969 },
  武汉: { lat: 30.5928, lng: 114.3055 },
  昆山: { lat: 31.3847, lng: 120.9584 },
  青岛: { lat: 36.0671, lng: 120.3826 },
  宁波: { lat: 29.8683, lng: 121.5440 },
  厦门: { lat: 24.4798, lng: 118.0894 },
  福州: { lat: 26.0745, lng: 119.2965 },
}

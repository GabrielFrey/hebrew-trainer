# Выпуск в App Store

Приложение: «Иврит с нуля», bundle ID `app.hebrew.trainer`.

Всё, что можно сделать без macOS, уже в репозитории. Остальное требует Mac с Xcode
либо сборки через EAS — это собрано в разделе «Что нужно сделать на Mac».

## Что готово

### Идентификаторы и версии

| Что | Значение | Где |
| --- | --- | --- |
| `ios.bundleIdentifier` | `app.hebrew.trainer` | `app.json` |
| `android.package` | `app.hebrew.trainer` | `app.json` |
| `version` | `0.2.0` | `app.json` |
| `ios.buildNumber` | `1` | `app.json` |

Шаблонный `com.example.hebrewcoach` и slug `hebrew-coach` убраны.

### Иконка и splash

`scripts/build-icons.mjs` рисует зелёный квадрат, пятно-маскот и настоящий алеф шрифтом
Noto Sans Hebrew. Пересобрать: `node scripts/build-icons.mjs`.

- `assets/images/icon.png` — 1024×1024, `rgb24`, **без альфа-канала** (Apple отклоняет
  иконки с прозрачностью);
- `assets/images/adaptive-icon.png` — 1024×1024 RGBA, передний план для Android;
- `assets/images/splash-icon.png` — 1024×1024 RGBA, подключён через плагин
  `expo-splash-screen` с `imageWidth: 220` и фоном `#EAF8DE` / тёмным `#102016`;
- `assets/images/favicon.png` — 64×64 для веба;
- `assets/images/icon-{180,167,152,120,80,76,40}.png` — размеры иконок App Store / iPhone.

На всех картинках нет никакого текста, кроме одной большой буквы, так что требование
«без текста на иврите мельче 32 pt» выполняется по построению.

### Privacy manifest

В `app.json` → `ios.privacyManifests` (Expo укладывает это в `PrivacyInfo.xcprivacy`):

- `NSPrivacyTracking: false` и пустой `NSPrivacyTrackingDomains` — трекинга нет;
- `NSPrivacyCollectedDataTypes: []` — приложение не собирает данные: нет аккаунта,
  бэкенда и аналитики, прогресс лежит только в AsyncStorage на устройстве;
- `NSPrivacyAccessedAPITypes` — одна запись
  `NSPrivacyAccessedAPICategoryUserDefaults` с причиной `CA92.1` (доступ к
  `UserDefaults` из самого приложения). Это обязательная декларация для
  AsyncStorage, иначе App Store Connect вернёт ITMS-91053.

### Usage strings

- `NSMicrophoneUsageDescription` — плагин `expo-audio` всё равно добавляет ключ, поэтому
  текст прямо говорит, что микрофон не используется. Запись отключена:
  `microphonePermission: false`, `recordAudioAndroid: false`, а на Android
  `RECORD_AUDIO` добавлен в `blockedPermissions`.
- `NSUserTrackingUsageDescription` — на случай ревью: трекинга нет.
- `ITSAppUsesNonExemptEncryption: false` — своей криптографии нет, экспортную анкету
  в App Store Connect проходить не придётся.
- `CFBundleDisplayName` и `locales/ru.json` — имя на экране «Иврит с нуля».
- `CFBundleAllowMixedLocalizations: true` — интерфейс русский, материал на иврите.

### Уведомления

Локальные, без пуш-сервера: `apns-*` сертификаты и Firebase не нужны. На Android
объявлены `POST_NOTIFICATIONS` и `SCHEDULE_EXACT_ALARM`, канал `daily-practice`.
Разрешение запрашивается после онбординга, отказ ничего не блокирует.

## Что нужно сделать на Mac

### 1. Аккаунт и идентификаторы

- Apple Developer Program, 99 $ в год.
- В App Store Connect создать приложение с bundle ID `app.hebrew.trainer`
  (зарегистрировать его в Certificates, Identifiers & Profiles).
- Capabilities: ничего включать не нужно — ни Push Notifications (уведомления
  локальные), ни App Groups, ни iCloud.

### 2. Сборка и подпись

Через EAS (можно и не с Mac, сборка идёт в облаке):

```bash
npm i -g eas-cli
eas login
eas build:configure
eas build -p ios --profile production
eas submit -p ios
```

Локально на Mac:

```bash
npx expo prebuild -p ios     # создаст каталог ios/ из app.json
npx pod-install
open ios/hebrewtrainer.xcworkspace
```

Дальше в Xcode: выбрать команду разработчика, дать Xcode выпустить Distribution
Certificate и App Store provisioning profile, затем Product → Archive →
Distribute App → App Store Connect.

Проверить после prebuild: в `ios/` появился `PrivacyInfo.xcprivacy` с содержимым из
`privacyManifests`, иконка собралась без альфа-канала.

### 3. Скриншоты

Нужны 6.7″ (1290×2796) и 6.5″ (1242×2688), минимум по 3 на размер. Снимать на
симуляторе iPhone 16 Pro Max и iPhone 11 Pro Max:

```bash
npx expo run:ios --device "iPhone 16 Pro Max"
xcrun simctl io booted screenshot screenshot.png
```

Что показывать: «Сегодня» с собранной очередью и серией дней, карточку сессии с
крупной буквой, холст «напиши букву», экран «Слова» с колодами, «Чтение» с
переключателем огласовок, «Прогресс». Снять в светлой и тёмной теме.

### 4. Метаданные магазина

- Название: «Иврит с нуля», подзаголовок: «Буквы, слова и чтение за 10 минут в день».
- Категория: Education, вторичная — Reference.
- Возрастной рейтинг: 4+.
- Языки локализации страницы: русский (основной).
- Ключевые слова: иврит, никуд, алфавит, карточки, SM-2, чтение.
- Описание и «что нового» — на русском.

### 5. Политика конфиденциальности

Нужен публичный URL. Текст короткий и честный: приложение не собирает и не передаёт
никаких данных, весь прогресс хранится на устройстве в AsyncStorage, аккаунта и
бэкенда нет, аналитики нет. В анкете App Privacy отметить «Data Not Collected».

### 6. Лицензии на аудио

Все вложенные записи — CC0 из Викисловаря иврита, список с авторами и ссылками в
`assets/audio/credits.json`. CC0 не требует указания авторства, но атрибуция
сохранена. Если в приложение добавятся записи под CC BY или CC BY-SA, в приложении
понадобится экран «Благодарности» со списком авторов и лицензий — сейчас его нет.

### 7. Перед отправкой

- [ ] `npx tsc --noEmit`, `npm test`, `npx expo lint` — без ошибок
- [ ] Прогнать онбординг на чистом устройстве и проверить запрос разрешения
- [ ] Проверить, что при отказе от уведомлений приложение работает полностью
- [ ] Проверить тёмную и светлую тему на всех пяти вкладках
- [ ] Проверить холст «напиши букву» пальцем на реальном устройстве, а не в симуляторе
- [ ] Убедиться, что кнопки озвучки нет там, где файла нет (не заглушка «нет записи»)
- [ ] Поднять `ios.buildNumber` перед каждой новой загрузкой

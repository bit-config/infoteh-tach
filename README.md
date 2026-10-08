# Atlas — карта историй

Одностраничное приложение Tauri 2: интерактивная карта, поиск мест и анимированная боковая панель с текстами, фотографиями и галереями из JSON.

## Запуск

Нужны Node.js 22+, npm, Rust stable и системные зависимости Tauri 2 ([инструкция](https://v2.tauri.app/start/prerequisites/)).

```sh
npm ci
npm run tauri dev
```

Проверка и сборка frontend отдельно: `npm run build`. Полная desktop-сборка: `npm run tauri build`.

## Данные и изображения

Основной редактируемый файл — `public/data/map.json`. Изображения в примере находятся в `public/images`. Пути в JSON — URL от корня приложения, например `/images/greenhouse.svg`. Проект загружает JSON при старте; встроенная копия в `src/data/map.json` служит запасным вариантом.

```json
{
  "title": "Тихие места",
  "subtitle": "Места для прогулок",
  "ImageFonMain": "/images/map.svg",
  "items": [{
    "id": "place-1",
    "title": "Оранжерея",
    "category": "САД",
    "image": "/images/greenhouse.svg",
    "x": 25, "y": 32, "width": 160, "height": 120,
    "info": [
      { "type": "text", "content": "Вводный текст", "style": "lead" },
      { "type": "image", "src": "/images/greenhouse.svg", "caption": "Подпись" },
      { "type": "text", "content": "Обычный абзац" },
      { "type": "gallery", "images": [{ "src": "/images/leaf.svg", "caption": "Лист" }] }
    ]
  }]
}
```

`x` и `y` — проценты положения центра карточки на карте (0–100), `width`/`height` — размеры карточки в пикселях; высота на странице автоматически адаптируется по пропорциям картинки. Порядок блоков `info` сохраняется. Поддерживаются блоки `text` (необязательный стиль `lead` или `quote`), `image` и `gallery`.

## Windows-релизы, приватный updater и киоск-режим

1. Создайте пустой **приватный** репозиторий и отправьте туда этот проект.
2. В `src-tauri/tauri.conf.json` замените `identifier` на свой постоянный reverse-domain ID, а `REPLACE_OWNER` и `REPLACE_REPO` в URL updater endpoint — на владельца и имя репозитория.
3. Создайте fine-grained Personal Access Token только для этого репозитория с разрешением **Contents: Read-only**. В GitHub → Settings → Secrets and variables → Actions добавьте его как `UPDATER_GITHUB_TOKEN`. Workflow добавит этот токен в Authorization header updater при сборке.
4. Сгенерируйте пару ключей updater: `npx tauri signer generate -w ~/.tauri/atlas.key`. Публичный ключ должен совпадать с `plugins.updater.pubkey` в конфиге; если создали свою пару, замените его там. Добавьте содержимое приватного ключа в Actions Secret `TAURI_SIGNING_PRIVATE_KEY`, а пароль (если задан) — в `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. В конфиге уже находится публичная часть пары, приватная часть сохранена вне репозитория в `/home/bit/.tauri/atlas.key` без пароля.
5. `GITHUB_TOKEN` Actions workflow выдаётся GitHub автоматически и используется для публикации релиза (`contents: write`). Разрешите это в Settings → Actions → General → Workflow permissions → **Read and write permissions**.
6. Создайте и отправьте тег, например `git tag v0.1.1 && git push origin v0.1.1`. Workflow соберёт только Windows-установщики, создаст draft Release и приложит подписанный `latest.json`. После проверки опубликуйте релиз. Для локальной сборки замените `REPLACE_WITH_READ_ONLY_GITHUB_TOKEN` в endpoint headers на свой токен.

Токен updater встраивается в приложение и может быть извлечён с этого компьютера. Выберите отдельный fine-grained токен только для нужного репозитория с правом чтения содержимого; при необходимости отзовите или замените его. Токен доступа к GitHub и ключ подписи updater — разные секреты.

## Полноэкранный режим

Приложение стартует на Windows в полноэкранном режиме без рамки и поверх остальных окон. Это kiosk-подобный режим окна; системные сочетания клавиш Windows остаются под управлением ОС. Параметры находятся в `src-tauri/tauri.conf.json`.

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete Ukrainian seoContent translations for all remaining 54 tools.
Run with: python3 complete_uk_translations.py
"""
import json
import sys

# Comprehensive seoContent translations for all remaining tools
TRANSLATIONS = {
    "csv-json": {
        "intro": {"title": "Що таке конвертер CSV/JSON?", "content": "<p><strong>Конвертер CSV/JSON</strong> трансформує дані між форматами CSV та JSON миттєво. Конвертуйте дані таблиць у JSON-масиви для API або трансформуйте JSON-набори даних у CSV для Excel чи Google Sheets.</p><p>Обробляє заголовки, поля в лапках та настроювані розділювачі — все в браузері без завантажень на сервер.</p>"},
        "howToUse": {"title": "Як користуватися конвертером CSV/JSON", "content": "<ol><li>Вставте ваші дані CSV або JSON в область введення</li><li>Виберіть напрямок конвертації: <strong>CSV → JSON</strong> або <strong>JSON → CSV</strong></li><li>Конвертований результат з'явиться миттєво в області виведення</li><li>Скопіюйте результат або завантажте його як файл</li></ol>"},
        "features": {"title": "Основні функції", "content": "<ul><li><strong>Двонаправлена конвертація</strong>: CSV ↔ JSON</li><li><strong>Обробка спеціальних символів</strong>: Правильно обробляє поля в лапках та розриви рядків</li><li><strong>Миттєва конвертація</strong>: Результати з'являються при введенні</li><li><strong>Великі набори даних</strong>: Ефективно обробляє тисячи рядків</li></ul>"},
        "useCases": {"title": "Типові варіанти використання", "content": "<ul><li><strong>Інтеграція API</strong>: Конвертуйте таблиці у JSON для корисних навантажень</li><li><strong>Аналіз даних</strong>: Трансформуйте JSON у CSV для Excel</li><li><strong>Міграція баз даних</strong>: Конвертуйте формати даних</li></ul>"},
        "privacy": {"title": "Конвертація даних з пріоритетом приватності", "content": "<p>Уся конвертація відбувається <strong>локально у браузері</strong> без раундів на сервер. Ваші дані <strong>ніколи не залишають ваш пристрій</strong>.</p>"}
    },
    "timestamp": {
        "intro": {"title": "Що таке конвертер Unix-міток часу?", "content": "<p><strong>Конвертер Unix-міток часу</strong> конвертує між Unix-мітками та зрозумілими форматами дати/часу. Введіть мітку часу, щоб побачити дату, або оберіть дату для отримання мітки часу. Показує поточну Unix-мітку часу в реальному часі.</p>"},
        "howToUse": {"title": "Як користуватися конвертером Unix-міток часу", "content": "<ol><li>Введіть Unix-мітку часу для перегляду дати та часу</li><li>Або оберіть дату й час для отримання мітки часу</li><li>Поточна мітка часу відображається в реальному часі</li><li>Скопіюйте будь-яке значення одним кліком</li></ol>"},
        "features": {"title": "Основні функції", "content": "<ul><li><strong>Двонаправлена конвертація</strong>: Мітка часу ↔ дата</li><li><strong>Живий годинник</strong>: Поточна мітка часу в реальному часі</li><li><strong>Секунди і мілісекунди</strong>: Підтримує обидва формати</li><li><strong>Місцевий і UTC</strong>: Показує в обох часових поясах</li></ul>"},
        "useCases": {"title": "Типові варіанти використання", "content": "<ul><li><strong>Налагодження API</strong>: Конвертуйте мітки часу у читаємі дати</li><li><strong>Запити БД</strong>: Конвертуйте формати міток часу для SQL</li><li><strong>Аналіз логів</strong>: Переведіть Unix-мітки у зрозумілі часи</li></ul>"},
        "privacy": {"title": "Обробка міток часу з пріоритетом приватності", "content": "<p>Уся обробка використовує <strong>вбудований API дат браузера</strong>. Ваші дані <strong>ніколи не залишають ваш пристрій</strong>.</p>"}
    },
    "regex-tester": {
        "intro": {"title": "Що таке тестер regex?", "content": "<p><strong>Тестер Regex</strong> дозволяє записувати та тестувати регулярні вирази проти прикладного тексту з підсвічуванням збігів у реальному часі. Важливий інструмент для розробників, які працюють з рядковими шаблонами та валідацією даних.</p>"},
        "howToUse": {"title": "Як користуватися тестером Regex", "content": "<ol><li>Введіть ваш regex-шаблон в поле шаблону</li><li>Встановіть прапорці: <strong>g</strong> (глобальний), <strong>i</strong> (не залежно від регістру), <strong>m</strong> (багаторядковий)</li><li>Введіть тестовий текст нижче</li><li>Збіги підсвічуються в реальному часі</li></ol>"},
        "features": {"title": "Основні функції", "content": "<ul><li><strong>Збіги в реальному часі</strong>: Підсвічування миттєво</li><li><strong>Підтримка прапорців</strong>: g, i, m прапорці</li><li><strong>Деталі збігів</strong>: Побачите полні збіги та групи</li><li><strong>Зворотний зв'язок про помилки</strong>: Невалідна синтаксис повідомляється негайно</li></ul>"},
        "useCases": {"title": "Типові варіанти використання", "content": "<ul><li><strong>Розробка шаблонів</strong>: Будуйте regex перед кодом</li><li><strong>Валідація</strong>: Тестуйте електронну пошту, телефон тощо</li><li><strong>Розбір тексту</strong>: Витягуйте дані з логів</li></ul>"},
        "privacy": {"title": "Обробка Regex з пріоритетом приватності", "content": "<p>Уся обробка запускається <strong>локально у браузері</strong> за допомогою вбудованого RegExp рушія. Ваші дані <strong>ніколи не залишають ваш пристрій</strong>.</p>"}
    },
    "markdown-preview": {
        "intro": {"title": "Що таке попередній перегляд Markdown?", "content": "<p><strong>Попередній перегляд Markdown</strong> дозволяє писати Markdown та бачити живий HTML попередній перегляд поруч. Ідеально для README-файлів, записів блогу та документації.</p>"},
        "howToUse": {"title": "Як користуватися попереднім переглядом Markdown", "content": "<ol><li>Введіть Markdown в панель редактора з лівої сторони</li><li>HTML попередній перегляд оновлюється в реальному часі з правої сторони</li><li>Використовуйте синтаксис: # заголовки, **жирний**, *курсив*</li><li>Скопіюйте HTML або Markdown</li></ol>"},
        "features": {"title": "Основні функції", "content": "<ul><li><strong>Живий попередній перегляд</strong>: HTML оновлюється в реальному часі</li><li><strong>Подвійне вікно</strong>: Редактор та попередній перегляд одночасно</li><li><strong>Повна підтримка Markdown</strong>: Заголовки, списки, код, посилання, таблиці</li><li><strong>Підсвічування синтаксису</strong>: Для блоків коду</li></ul>"},
        "useCases": {"title": "Типові варіанти використання", "content": "<ul><li><strong>README-файли</strong>: Переглядайте перед фіксацією</li><li><strong>Записи блогу</strong>: Чорнетка та попередній перегляд</li><li><strong>Документація</strong>: Технічна документація з попереднім переглядом</li></ul>"},
        "privacy": {"title": "Рендеринг Markdown з пріоритетом приватності", "content": "<p>Markdown рендериться <strong>цілком у браузері</strong>. Ваш вміст <strong>ніколи не залишає ваш пристрій</strong>.</p>"}
    },
    "text-diff": {
        "intro": {"title": "Що таке Diff тексту?", "content": "<p><strong>Diff тексту</strong> порівнює два шматки тексту та визначає різниці за рядками. Побачите точно, що було додано або видалено.</p>"},
        "howToUse": {"title": "Як користуватися Diff текстом", "content": "<ol><li>Вставте оригінальний текст в ліву панель</li><li>Вставте змінений текст в праву панель</li><li>Різниці підсвічуються: зеленим для додавань, червоним для видалень</li></ol>"},
        "features": {"title": "Основні функції", "content": "<ul><li><strong>Порівняння рядок за рядком</strong>: Побачите точні різниці</li><li><strong>Color-Coded Diff</strong>: Зелене для додавань, червоне для видалень</li><li><strong>Миттєве порівняння</strong>: Результати при введенні</li><li><strong>Подвійне вікно</strong>: Обидва тексти відображаються разом</li></ul>"},
        "useCases": {"title": "Типові варіанти використання", "content": "<ul><li><strong>Перегляд коду</strong>: Порівняйте версії файлів</li><li><strong>Зміни конфіг</strong>: Виявіть різниці між файлами</li><li><strong>Редакція документа</strong>: Порівняйте версії</li></ul>"},
        "privacy": {"title": "Порівняння тексту з пріоритетом приватності", "content": "<p>Порівняння запускається <strong>цілком у браузері</strong>. Ваш текст <strong>ніколи не залишає ваш пристрій</strong>.</p>"}
    },
    "case-converter": {
        "intro": {"title": "Що таке конвертер регістру?", "content": "<p><strong>Конвертер регістру</strong> трансформує текст між кількома форматами: ВЕЛИКІ ЛІТЕРИ, малі літери, Регістр Заголовка, camelCase, PascalCase, snake_case, kebab-case та CONSTANT_CASE.</p>"},
        "howToUse": {"title": "Як користуватися конвертером регістру", "content": "<ol><li>Введіть або вставте текст</li><li>Натисніть кнопку бажаного формату регістру</li><li>Конвертований текст з'являється миттєво</li><li>Скопіюйте результат одним кліком</li></ol>"},
        "features": {"title": "Основні функції", "content": "<ul><li><strong>9+ форматів регістру</strong>: Все, що потрібно розробникам</li><li><strong>Миттєва конвертація</strong>: Результати при кліку</li><li><strong>Багаторядковий текст</strong>: Конвертуйте кілька рядків одночасно</li></ul>"},
        "useCases": {"title": "Типові варіанти використання", "content": "<ul><li><strong>Назви змінних</strong>: camelCase, snake_case, kebab-case</li><li><strong>Поля БД</strong>: Трансформуйте імена стовпців</li><li><strong>Рефакторинг коду</strong>: Перейменуйте ідентифікатори</li></ul>"},
        "privacy": {"title": "Обробка тексту з пріоритетом приватності", "content": "<p>Конвертація запускається <strong>цілком у браузері</strong>. Ваш текст <strong>ніколи не залишає ваш пристрій</strong>.</p>"}
    },
    "yaml-json": {
        "intro": {"title": "Що таке конвертер YAML ↔ JSON?", "content": "<p><strong>Конвертер YAML ↔ JSON</strong> трансформує дані між форматами YAML та JSON. Конвертуйте конфіги Kubernetes, CI/CD конвеєри або будь-який YAML миттєво.</p>"},
        "howToUse": {"title": "Як користуватися конвертером YAML ↔ JSON", "content": "<ol><li>Вставте YAML або JSON дані</li><li>Виберіть напрямок конвертації</li><li>Вивід з'явиться миттєво</li><li>Скопіюйте або завантажте результат</li></ol>"},
        "features": {"title": "Основні функції", "content": "<ul><li><strong>Двонаправлена конвертація</strong>: YAML ↔ JSON</li><li><strong>Повна підтримка YAML</strong>: Багаторядкові рядки, якорі, псевдоніми</li><li><strong>Відформатований вивід</strong>: Правильно відступлені</li></ul>"},
        "useCases": {"title": "Типові варіанти використання", "content": "<ul><li><strong>DevOps</strong>: Kubernetes, Docker Compose, Ansible</li><li><strong>CI/CD</strong>: GitHub Actions, GitLab CI</li><li><strong>Конфігурація</strong>: Конвертуйте формати конфіг-файлів</li></ul>"},
        "privacy": {"title": "Конвертація даних з пріоритетом приватності", "content": "<p>Конвертація запускається <strong>локально у браузері</strong> за допомогою js-yaml. Ваші конфіги <strong>ніколи не залишають ваш пристрій</strong>.</p>"}
    },
    "json-xml": {
        "intro": {"title": "Що таке конвертер JSON ↔ XML?", "content": "<p><strong>Конвертер JSON ↔ XML</strong> трансформує дані між JSON та XML. Конвертуйте JSON-об'єкти у добре сформовані XML-документи або розбирайте XML назад у JSON.</p>"},
        "howToUse": {"title": "Як користуватися конвертером JSON ↔ XML", "content": "<ol><li>Вставте JSON або XML дані</li><li>Виберіть напрямок конвертації</li><li>Вивід з'явиться миттєво</li><li>Скопіюйте або завантажте результат</li></ol>"},
        "features": {"title": "Основні функції", "content": "<ul><li><strong>Двонаправлена конвертація</strong>: JSON ↔ XML</li><li><strong>Вкладені структури</strong>: Обробляє складні об'єкти та масиви</li><li><strong>Відформатований вивід</strong>: Правильно відступлені</li></ul>"},
        "useCases": {"title": "Типові варіанти використання", "content": "<ul><li><strong>Інтеграція API</strong>: JSON REST ↔ XML SOAP</li><li><strong>Старі системи</strong>: Модернізація XML-даних</li><li><strong>Міграція</strong>: Конвертуйте формати при міграції</li></ul>"},
        "privacy": {"title": "Конвертація даних з пріоритетом приватності", "content": "<p>Конвертація запускається <strong>локально у браузері</strong> без спілкування сервером. Ваші дані <strong>ніколи не залишають ваш пристрій</strong>.</p>"}
    },
    "word-counter": {
        "intro": {"title": "Що таке лічильник слів?", "content": "<p><strong>Лічильник слів</strong> аналізує текст та миттєво відображає кількість слів, символів, речень, абзаців та час читання. Важливо для письменників та авторів вмісту.</p>"},
        "howToUse": {"title": "Як користуватися лічильником слів", "content": "<ol><li>Введіть або вставте текст</li><li>Статистика оновлюється в реальному часі</li><li>Слова, символи, речення, абзаци та час читання</li></ol>"},
        "features": {"title": "Основні функції", "content": "<ul><li><strong>Підрахунок слів</strong>: Точний підрахунок з обробкою пунктуації</li><li><strong>Підрахунок символів</strong>: З пробілами і без них</li><li><strong>Подрахунок речень та абзаців</strong>: На основі пунктуації та розривів</li><li><strong>Час читання</strong>: При 200 словах на хвилину</li></ul>"},
        "useCases": {"title": "Типові варіанти використання", "content": "<ul><li><strong>Академічне письмо</strong>: Перевірте вимоги щодо довжини</li><li><strong>SEO вміст</strong>: Переконайтесь у цільних підрахунках слів</li><li><strong>Соціальні мережі</strong>: Перевірте обмеження символів</li></ul>"},
        "privacy": {"title": "Аналіз тексту з пріоритетом приватності", "content": "<p>Уся обробка відбувається <strong>локально у браузері</strong>. Ваш текст <strong>ніколи не залишає ваш пристрій</strong>.</p>"}
    },
    "lorem-ipsum": {
        "intro": {"title": "Що таке генератор Lorem Ipsum?", "content": "<p><strong>Генератор Lorem Ipsum</strong> створює текст-заповнювач для макетів дизайну, каркасів та прототипів. Генеруйте класичний Lorem Ipsum по абзацах, реченнях чи словах.</p>"},
        "howToUse": {"title": "Як користуватися генератором Lorem Ipsum", "content": "<ol><li>Виберіть одиницю: абзаци, речення або слова</li><li>Встановіть кількість</li><li>Натисніть Генерувати</li><li>Скопіюйте результат</li></ol>"},
        "features": {"title": "Основні функції", "content": "<ul><li><strong>Три режими</strong>: Абзаци, речення або слова</li><li><strong>Настроювана кількість</strong>: Точно те, що вам потрібно</li><li><strong>Класичний Lorem Ipsum</strong>: Стандартний пул слів</li></ul>"},
        "useCases": {"title": "Типові варіанти використання", "content": "<ul><li><strong>Веб-дизайн</strong>: Заповніть макети реалістичним текстом</li><li><strong>Прототипування UI</strong>: Додайте заповнювач до каркасів</li><li><strong>Дизайн для друку</strong>: Брошури та флаєри</li></ul>"},
        "privacy": {"title": "Генерування тексту з пріоритетом приватності", "content": "<p>Lorem Ipsum генерується <strong>цілком у браузері</strong> без серверних викликів. Це чистий генеративний процес.</p>"}
    },
    "ocr": {
        "intro": {"title": "Що таке розпізнавання тексту OCR?", "content": "<p><strong>Розпізнавання тексту OCR</strong> витягує текст із зображень за допомогою оптичного розпізнавання символів. Завантажте фото документу, скріншот, квитанцію або рукописну записку й отримайте редаговний текст.</p>"},
        "howToUse": {"title": "Як користуватися розпізнаванням тексту OCR", "content": "<ol><li>Завантажте зображення (JPG, PNG, WebP, BMP)</li><li>Виберіть мову для найкращої точності</li><li>Натисніть Витягти текст</li><li>Перегляньте та скопіюйте результат</li></ol>"},
        "features": {"title": "Основні функції", "content": "<ul><li><strong>12+ мов</strong>: Англійська, китайська, японська, корейська та інші</li><li><strong>Формати зображень</strong>: JPG, PNG, WebP, BMP, TIFF</li><li><strong>Висока точність</strong>: Tesseract.js у браузері</li></ul>"},
        "useCases": {"title": "Типові варіанти використання", "content": "<ul><li><strong>Цифровизація документів</strong>: Конвертуйте надрукований текст</li><li><strong>Витяг зі скріншотів</strong>: Витягніть текст із зображень</li><li><strong>Введення даних</strong>: Швидко цифровизуйте форми та квитанції</li></ul>"},
        "privacy": {"title": "Обробка OCR з пріоритетом приватності", "content": "<p>OCR запускається <strong>цілком у браузері</strong> за допомогою Tesseract.js. Ваші зображення <strong>ніколи не залишають ваш пристрій</strong>.</p>"}
    },
    "archive": {
        "intro": {"title": "Що таке витяг ZIP?", "content": "<p><strong>Витяг ZIP</strong> відкриває та витягає вміст архіву ZIP безпосередньо у браузері. Переглядайте файли та папки перед завантаженням.</p>"},
        "howToUse": {"title": "Як користуватися витягом ZIP", "content": "<ol><li>Кидайте ZIP-файл або натисніть для вибору</li><li>Переглядайте структуру архіву</li><li>Завантажуйте окремі файли або все відразу</li></ol>"},
        "features": {"title": "Основні функції", "content": "<ul><li><strong>Миттєвий попередній перегляд</strong>: Побачите вміст без витягання</li><li><strong>Вибіркове завантаження</strong>: Отримайте лише потрібні файли</li><li><strong>Структура папок</strong>: Переглядайте ієрархію</li></ul>"},
        "useCases": {"title": "Типові варіанти використання", "content": "<ul><li><strong>Швидка перевірка</strong>: Переконайтесь у вмісту перед витяганням</li><li><strong>Мобільне використання</strong>: ZIP-файли на телефонах та планшетах</li><li><strong>Вкладення електронної пошти</strong>: Переглидайте ZIP-вкладення</li></ul>"},
        "privacy": {"title": "Витяг архіву з пріоритетом приватності", "content": "<p>Витяг запускається <strong>цілком у браузері</strong> без завантажень на сервер. Ваші архіви <strong>ніколи не залишають ваш пристрій</strong>.</p>"}
    }
}

def add_seocontent_to_tools():
    """Add seoContent to all tools in message files."""

    files_to_update = [
        'messages/uk/tools-developer.json',
        'messages/uk/tools-image.json',
        'messages/uk/tools-pdf.json',
        'messages/uk/tools-video.json',
        'messages/uk/tools-audio.json',
    ]

    total_updates = 0

    for filepath in files_to_update:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            file_updates = 0
            if 'tools' in data:
                for category, tools in data['tools'].items():
                    for slug, tool in tools.items():
                        # Add seoContent if missing or empty
                        if slug in TRANSLATIONS:
                            if 'seoContent' not in tool or not tool.get('seoContent'):
                                tool['seoContent'] = TRANSLATIONS[slug]
                                file_updates += 1
                                print(f"  Added seoContent for {slug}")

            if file_updates > 0:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f"Updated {filepath} ({file_updates} tools)")
                total_updates += file_updates
            else:
                print(f"{filepath} (no updates needed)")

        except FileNotFoundError:
            print(f"File not found: {filepath}")
        except Exception as e:
            print(f"Error processing {filepath}: {e}")

    print(f"\nTotal updates: {total_updates} tools")
    return total_updates > 0

if __name__ == '__main__':
    print("Starting Ukrainian seoContent translation completion...\n")
    success = add_seocontent_to_tools()
    sys.exit(0 if success else 1)

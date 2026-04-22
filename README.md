### Hexlet tests and linter status:
[![Actions Status](https://github.com/ksbulgakov/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/ksbulgakov/ai-for-developers-project-386/actions)
 давай создадим страницу создания типа события - на этой странице должен быть заголовок "События", кнопка "Создать", ниже список из из созданых событий, элемент списка
  событий содержит в себе слева название и время (в виде бейджика) под названием и справа кнопку удалить. Компоеннты нужно взять из библиотеки mantine. Для этого создадим
  отдельную страница под названием EvntTypesList.tsx и показывать ее нужно по пути /event-types События создаваемые на этой странице должны соответсвенно создавать сущности
  EventTypes которая описана в typespec, а сейчас, пока нет реального апи, нужно использовать mock этого эндпоинта

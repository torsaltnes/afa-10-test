# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [INIT-001] – Greenfield architecture initialisation – 2026-04-29
### Added
- Et ekte Angular testoppsett med Karma/Jasmine og støtte for headless kjøring.
- `tsconfig.spec.json`, `karma.conf.js` og en minimal, bestående spekfil for `app.component`.
- Testavhengigheter og Angular CLI-konfigurasjon for frontend-tester.
### Changed
- Frontendens `ng test`-mål ble koblet til en faktisk testtarget i `angular.json`.
### Fixed
- Frontend-testoppsettet ble justert slik at `npm run test -- --watch=false --browsers=ChromeHeadless` går gjennom uten feil.

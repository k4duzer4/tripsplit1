import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { resolveLanguage, t } from '../src/lib/i18n.js';
import { messages } from '../src/lib/locales/messages.js';
import { formatMoneyInput, maskMoneyInput } from '../src/lib/moneyInput.js';
import { formatMoney, formatDate } from '../src/lib/format.js';

test('idioma e formatos seguem as preferências do navegador', () => {
  assert.deepEqual(resolveLanguage(['en-US', 'pt-BR']), { language: 'en', locale: 'en-US' });
  assert.deepEqual(resolveLanguage(['es-AR']), { language: 'es', locale: 'es-AR' });
  assert.deepEqual(resolveLanguage(['pt-PT']), { language: 'pt', locale: 'pt-PT' });
  assert.equal(resolveLanguage(['fr-FR']).language, 'en');
  assert.equal(t('Nova despesa', {}, 'en'), 'New expense');
  assert.equal(t('Nova despesa', {}, 'es'), 'Nuevo gasto');
  assert.equal(t('Valor ({0})', { 0: 'EUR' }, 'en'), 'Amount (EUR)');
  assert.equal(formatMoney(123456, 'USD', 'en-US'), '$1,234.56');
  assert.equal(formatDate('2026-10-09', 'en-US'), '10/9/2026');
  for (const [key, translations] of Object.entries(messages)) {
    for (const lang of ['pt', 'en', 'es']) {
      assert.ok(translations[lang], `${key}: missing ${lang}`);
      assert.deepEqual([...translations[lang].matchAll(/\{\w+\}/g)].map((match) => match[0]).sort(), [...key.matchAll(/\{\w+\}/g)].map((match) => match[0]).sort(), `${key}: placeholders in ${lang}`);
    }
  }
});

test('máscara usa centavos exatos, aceita colar, apagar e editar em cada locale', () => {
  for (const lang of ['pt-BR', 'en-US', 'es-ES', 'pt-PT', 'ar-EG', 'fa-IR']) {
    for (const cents of [0, 1, 1234, 123456, 999999999999]) {
      const masked = maskMoneyInput(formatMoneyInput(cents, lang), lang);
      assert.equal(masked.cents, cents);
      assert.equal(masked.display, formatMoneyInput(cents, lang));
    }
    assert.deepEqual(maskMoneyInput('', lang), { cents: 0, display: '' });
    assert.equal(maskMoneyInput('abc1234', lang).cents, 1234);
  }
  assert.equal(maskMoneyInput('123456', 'pt-BR').display, '1.234,56');
  assert.equal(maskMoneyInput('123456', 'en-US').display, '1,234.56');
});

test('textos JSX da aplicação não ficam fixos em um idioma e não contêm emojis', () => {
  const leftovers = [];
  const scan = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) scan(file);
      else if (file.endsWith('.jsx')) {
        const source = fs.readFileSync(file, 'utf8');
        assert.equal(/[\p{Extended_Pictographic}\uFE0F]/u.test(source), false, `${file} contains emoji`);
        const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
        assert.equal(ast.parseDiagnostics.length, 0, `${file} has invalid JSX`);
        const visit = (node) => {
          if (ts.isCallExpression(node) && ['t', 'tr'].includes(node.expression.getText(ast)) && ts.isStringLiteral(node.arguments[0])) assert.ok(messages[node.arguments[0].text], `${file}: missing translation ${node.arguments[0].text}`);
          if (ts.isJsxText(node) && /[A-Za-zÀ-ÿ]/.test(node.text) && !/^(PDF|tripsplit|trip|split)\.?$/.test(node.text.trim())) leftovers.push(`${file}: ${node.text.trim()}`);
          if (ts.isJsxAttribute(node) && ['title', 'subtitle', 'aria-label', 'alt'].includes(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer) && /[A-Za-zÀ-ÿ]/.test(node.initializer.text)) leftovers.push(`${file}: ${node.initializer.text}`);
          ts.forEachChild(node, visit);
        };
        visit(ast);
      }
    }
  };
  scan('src');
  assert.deepEqual(leftovers, []);
});

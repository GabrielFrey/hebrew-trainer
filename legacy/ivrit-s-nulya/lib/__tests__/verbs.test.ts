import { answersMatch } from '@/lib/hebrew-script';
import { allVerbs, getVerb, verbCount } from '@/lib/verbs';

function he(text: string): string {
  return text.normalize('NFC');
}

describe('глаголы', () => {
  it('держит 100–200 проверенных глаголов и все семь биньянов', () => {
    const verbs = allVerbs();
    expect(verbCount()).toBeGreaterThanOrEqual(100);
    expect(verbCount()).toBeLessThanOrEqual(200);
    const binyanim = new Set(verbs.map((verb) => verb.binyan));
    expect(binyanim).toEqual(
      new Set(['paal', 'nifal', 'piel', 'pual', 'hifil', 'hufal', 'hitpael'])
    );
    verbs.forEach((verb) => {
      expect(verb.forms.past['3ms'].length).toBeGreaterThan(0);
      expect(verb.forms.present.ms.length).toBeGreaterThan(0);
      expect(verb.forms.future['3ms'].length).toBeGreaterThan(0);
      if (verb.binyan !== 'pual' && verb.binyan !== 'hufal') {
        expect(verb.forms.infinitive.length).toBeGreaterThan(0);
      }
    });
  });

  it('спрягает ключевые формы пааля, пиэля и һифиля', () => {
    const katav = getVerb('katav');
    expect(he(katav?.forms.infinitive ?? '')).toBe(he('לִכְתֹּב'));
    expect(he(katav?.forms.present.ms ?? '')).toBe(he('כּוֹתֵב'));
    expect(he(katav?.forms.past['3ms'] ?? '')).toBe(he('כָּתַב'));
    expect(he(katav?.forms.past['1sg'] ?? '')).toBe(he('כָּתַבְתִּי'));
    expect(he(katav?.forms.future['3ms'] ?? '')).toBe(he('יִכְתֹּב'));

    const diber = getVerb('diber');
    expect(he(diber?.forms.infinitive ?? '')).toBe(he('לְדַבֵּר'));
    expect(he(diber?.forms.present.ms ?? '')).toBe(he('מְדַבֵּר'));
    expect(he(diber?.forms.past['3ms'] ?? '')).toBe(he('דִּבֵּר'));

    const hikhtiv = getVerb('hikhtiv');
    expect(he(hikhtiv?.forms.infinitive ?? '')).toBe(he('לְהַכְתִּיב'));
    expect(he(hikhtiv?.forms.past['3ms'] ?? '')).toBe(he('הִכְתִּיב'));
    expect(he(hikhtiv?.forms.present.ms ?? '')).toBe(he('מַכְתִּיב'));
  });

  it('держит таблицы для слабых частотных глаголов', () => {
    expect(he(getVerb('hayah')?.forms.infinitive ?? '')).toBe(he('לִהְיוֹת'));
    expect(he(getVerb('hayah')?.forms.past['3ms'] ?? '')).toBe(he('הָיָה'));
    expect(he(getVerb('ba')?.forms.infinitive ?? '')).toBe(he('לָבוֹא'));
    expect(he(getVerb('ba')?.forms.past['3ms'] ?? '')).toBe(he('בָּא'));
    expect(he(getVerb('natan')?.forms.infinitive ?? '')).toBe(he('לָתֵת'));
    expect(he(getVerb('natan')?.forms.past['1sg'] ?? '')).toBe(he('נָתַתִּי'));
    expect(he(getVerb('halakh')?.forms.infinitive ?? '')).toBe(he('לָלֶכֶת'));
    expect(he(getVerb('halakh')?.forms.present.ms ?? '')).toBe(he('הוֹלֵךְ'));
    expect(he(getVerb('asah')?.forms.infinitive ?? '')).toBe(he('לַעֲשׂוֹת'));
    expect(he(getVerb('asah')?.forms.past['3ms'] ?? '')).toBe(he('עָשָׂה'));
  });

  it('принимает ответ без никуда и с софитной формой', () => {
    expect(answersMatch('כתב', 'כָּתַב')).toBe(true);
    expect(answersMatch('מלך', 'מֶלֶךְ')).toBe(true);
    expect(answersMatch('כתב', 'דִּבֵּר')).toBe(false);
  });
});

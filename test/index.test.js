const fs = require('fs');
const path = require('path');
const { getParserTarget, getParsersTarget } = require('../index');

const formattedAnnotationsBuffer = fs.readFileSync(`${__dirname}/formattedAnnotations/PDF_searchable.json`);
const formattedAnnotations = JSON.parse(formattedAnnotationsBuffer);
const lineList = formattedAnnotations.lineList


const blankPageFormattedAnnotationsBuffer = fs.readFileSync(path.normalize(`${__dirname}/formattedAnnotations/blank.json`));
const blankPageFormattedAnnotations = JSON.parse(blankPageFormattedAnnotationsBuffer);
const blankLineList = blankPageFormattedAnnotations.lineList

describe('using parser to get target text from document', () => {
  describe('using the "after" parser method', () => {
    describe('starting from beginning of doc', () => {
      const prevTarget = {
        value: '',
        indices: {
          pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 0,
        },
        normalizedVertices: [{ x: 0 }, { x: 0.99999 }],
      };

      test('gets the first word in doc', () => {
        const parser = {
          count: 1,
          method: 'after',
          target: {
            pattern: '.+',
            unit: 'word',
          },
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 0, pageEnd: 0, phraseEnd: 0, wordEnd: 0,
          },
          value: 'Your',

          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].words[0].boundingBox.normalizedVertices],
          unitType: 'word',
        });
      });
      test('gets the first phrase in doc', () => {
        const parser = {
          count: 1,
          method: 'after',
          target: {
            pattern: '.+',
            unit: 'phrase',
          },
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 0, pageEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          value: 'Your Company',

          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].boundingBox.normalizedVertices],
          unitType: 'phrase',
          segments: null   
        });
      });
      test('returns falsy target value if no text exists in doc', () => {
        const parser = {
          count: 1,
          method: 'after',
          target: {
            pattern: '.+',
            unit: 'phrase',
          },
        };
        const receivedTarget = getParserTarget(blankLineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({ value: '' });
      });
      test('gets correct phrase using specific phrase count and pattern', () => {
        const parser = {
          count: 2,
          method: 'after',
          target: {
            pattern: '\\w{7}',
            unit: 'phrase',
          },
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 9, pageEnd: 0, phraseEnd: 1, wordEnd: 0,
          },
          value: 'Project',
          normalizedVertices: [...lineList.pages[0].lines[9].phrases[1].boundingBox.normalizedVertices],
          segments: null,
          unitType: 'phrase',   
        });
      });
      test('gets correct word using specific word count and pattern', () => {
        const parser = {
          count: 2,
          method: 'after',
          target: {
            pattern: '[a-zA-Z]{11}',
            unit: 'word',
          },
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 19, pageEnd: 0, phraseEnd: 0, wordEnd: 0,
          },
          value: 'Adjustments',
          normalizedVertices: [...lineList.pages[0].lines[19].phrases[0].words[0].boundingBox.normalizedVertices],
          unitType: 'word',   
          
        });
      });
      test('gets correct target value on additional page using specific count and pattern', () => {
        const parser = {
          count: 2,
          method: 'after',
          target: {
            pattern: '[a-zA-Z]{8}',
            unit: 'word',
          },
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 6, pageEnd: 1, phraseEnd: 1, wordEnd: 0,
          },
          value: 'Employee',
          normalizedVertices: [...lineList.pages[1].lines[6].phrases[1].words[0].boundingBox.normalizedVertices],
          unitType: 'word',
        });
      });
      test('returns falsy target value when word count exceeds the matching words found', () => {
        const parser = {
          count: 3,
          method: 'after',
          target: {
            pattern: '\\d{3}-\\d{4}',
            unit: 'word',
          },
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({ value: '' });
      });
      test('returns falsy target value when phrase count exceeds the matching phrases found', () => {
        const parser = {
          count: 3,
          method: 'after',
          target: {
            pattern: 'Your Company',
            unit: 'phrase',
          },
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({ value: '' });
      });
      test('returns falsy target value when no matching words found within word count', () => {
        const parser = {
          count: 1,
          method: 'after',
          target: {
            pattern: 'abcd1234',
            unit: 'word',
          },
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({ value: '' });
      });
      test('returns falsy target value when no matching phrases found within phrase count', () => {
        const parser = {
          count: 1,
          method: 'after',
          target: {
            pattern: 'abcd1234',
            unit: 'phrase',
          },
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({ value: '' });
      });
    });
    describe('starting from a previous target value', () => {
      test(`gets correct phrase when the previous target meets the following conditions: 
        1) it is a word embedded within a phrase, 
        2) it is not the last word of the phrase it is embedded within`, () => {
        const parser = {
          count: 5,
          method: 'after',
          target: {
            pattern: '.+',
            unit: 'phrase',
          },
        };
        const prevTarget = {
          value: 'Payable',
          indices: {
            pageEnd: 0, lineEnd: 6, phraseEnd: 1, wordEnd: 0,
          },
          normalizedVertices: [...lineList.pages[0].lines[6].phrases[1].words[0].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 7, pageEnd: 0, phraseEnd: 2, wordEnd: 0,
          },
          value: '123456',
          normalizedVertices: [...lineList.pages[0].lines[7].phrases[2].boundingBox.normalizedVertices],
          segments: null,
          unitType: 'phrase',  
        });
      });
      test(`gets correct phrase when the previous target meets the following conditions: 
        1) it is a word embedded within a phrase, 
        2) it is the last word of the phrase it is embedded within`, () => {
        const parser = {
          count: 5,
          method: 'after',
          target: {
            pattern: '.+',
            unit: 'phrase',
          },
        };
        const prevTarget = {
          value: 'to',
          indices: {
            pageEnd: 0, lineEnd: 6, phraseEnd: 1, wordEnd: 1,
          },
          normalizedVertices: [...lineList.pages[0].lines[6].phrases[1].words[1].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 8, pageEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          value: 'Company name',
          normalizedVertices: [...lineList.pages[0].lines[8].phrases[0].boundingBox.normalizedVertices],
          segments: null,
          unitType: 'phrase',  
        });
      });
      test('gets correct word when the previous target is a word', () => {
        const parser = {
          count: 9,
          method: 'after',
          target: {
            pattern: '.+',
            unit: 'word',
          },
        };
        const prevTarget = {
          value: 'Company',
          indices: {
            pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].words[1].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 3, pageEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          value: '456-7890',
          normalizedVertices: [...lineList.pages[0].lines[3].phrases[0].words[1].boundingBox.normalizedVertices],
          unitType: 'word',  
        });
      });
      test('gets correct phrase when the previous target is a phrase', () => {
        const parser = {
          count: 5,
          method: 'after',
          target: {
            pattern: '.+',
            unit: 'phrase',
          },
        };
        const prevTarget = {
          value: 'Your Company',
          indices: {
            pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 5, pageEnd: 0, phraseEnd: 0, wordEnd: 2,
          },
          value: 'Submitted on 01/01/2000',
          normalizedVertices: [...lineList.pages[0].lines[5].phrases[0].boundingBox.normalizedVertices],
          unitType: 'phrase',  
          segments: null
        });
      });
      test('gets correct word when the previous target is a phrase', () => {
        const parser = {
          count: 5,
          method: 'after',
          target: {
            pattern: '.+',
            unit: 'word',
          },
        };
        const prevTarget = {
          value: 'Your Company',
          indices: {
            pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 2, pageEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          value: 'City,',
          normalizedVertices: [...lineList.pages[0].lines[2].phrases[0].words[1].boundingBox.normalizedVertices],
          unitType: 'word', 
        });
      });
      test('gets the remaining phrase when the previous target is a word embedded within the same phrase', () => {
        const parser = {
          count: 1,
          method: 'after',
          target: {
            pattern: '.+',
            unit: 'phrase',
          },
        };
        const prevTarget = {
          value: 'Submitted',
          indices: {
            pageEnd: 0, lineEnd: 5, phraseEnd: 0, wordEnd: 0,
          },
          normalizedVertices: [...lineList.pages[0].lines[5].phrases[0].words[0].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        const wholeTargetPhrase = lineList.pages[0].lines[5].phrases[0]
        const secondHalfNormalizedVertices = [
          { x: wholeTargetPhrase.words[1].boundingBox.normalizedVertices[0].x, y: wholeTargetPhrase.boundingBox.normalizedVertices[0].y},
          { x: wholeTargetPhrase.boundingBox.normalizedVertices[1].x, y: wholeTargetPhrase.boundingBox.normalizedVertices[1].y },
          { x: wholeTargetPhrase.boundingBox.normalizedVertices[2].x, y: wholeTargetPhrase.boundingBox.normalizedVertices[2].y },
          { x: wholeTargetPhrase.words[1].boundingBox.normalizedVertices[3].x, y: wholeTargetPhrase.boundingBox.normalizedVertices[3].y }
        ]
        
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 5, pageEnd: 0, phraseEnd: 0, wordEnd: 2,
          },
          value: 'on 01/01/2000',
          normalizedVertices: secondHalfNormalizedVertices,
          unitType: 'phrase', 
          segments: {
            first: {
              normalizedVertices: [
                {x: wholeTargetPhrase.boundingBox.normalizedVertices[0].x, y: wholeTargetPhrase.boundingBox.normalizedVertices[0].y},
                {x: wholeTargetPhrase.words[0].boundingBox.normalizedVertices[1].x, y: wholeTargetPhrase.boundingBox.normalizedVertices[1].y},
                {x: wholeTargetPhrase.words[0].boundingBox.normalizedVertices[2].x, y: wholeTargetPhrase.boundingBox.normalizedVertices[2].y},
                {x: wholeTargetPhrase.boundingBox.normalizedVertices[3].x, y: wholeTargetPhrase.boundingBox.normalizedVertices[3].y }
              ],
              text: 'Submitted' 
            },
            second: {
              normalizedVertices: secondHalfNormalizedVertices,
              text: 'on 01/01/2000' 
            },
          }
        });
      });

    });
  });
  describe('using the "below" parser method to get target text', () => {
    describe('starting from beginning of doc', () => {
      const prevTarget = {
        value: '',
        indices: {
          pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 0,
        },
        normalizedVertices: [{ x: 0 }, { x: 0.99999999 }],
      };

      test('gets the first word in doc', () => {
        const parser = {
          count: 1,
          method: 'below',
          target: {
            pattern: '.+',
            unit: 'word',
          },
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 0, pageEnd: 0, phraseEnd: 0, wordEnd: 0,
          },
          value: 'Your',
          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].words[0].boundingBox.normalizedVertices],
          unitType: 'word',
        });
      });
      test('gets the first phrase in doc', () => {
        const parser = {
          count: 1,
          method: 'below',
          target: {
            pattern: '.+',
            unit: 'phrase',
          },
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 0, pageEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          value: 'Your Company',
          unitType: 'phrase',
          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].boundingBox.normalizedVertices],
          segments: null
        });
      });
      test('returns falsy target value if no text exists in doc', () => {
        const parser = {
          count: 1,
          method: 'below',
          target: {
            pattern: '.+',
            unit: 'phrase',
          },
        };
        const receivedTarget = getParserTarget(blankLineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({ value: '' });
      });
    });
    describe('starting from a previous target value', () => {
      test('gets correct target value on additional page using specific count and pattern', () => {
        const parser = {
          count: 12,
          method: 'below',
          target: {
            pattern: '.+',
            unit: 'phrase',
          },
        };
        const prevTarget = {
          value: 'Invoice',
          indices: {
            pageEnd: 0, lineEnd: 4, phraseEnd: 0, wordEnd: 0,
          },
          normalizedVertices: [...lineList.pages[0].lines[4].phrases[0].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 1, pageEnd: 1, phraseEnd: 0, wordEnd: 2,
          },
          value: '123 Your Street',
          normalizedVertices: [...lineList.pages[1].lines[1].phrases[0].boundingBox.normalizedVertices],
          unitType: 'phrase',
          segments: null
        });
      });
      test('returns falsy target value when word count exceeds the matching words found', () => {
        const parser = {
          count: 2,
          method: 'below',
          target: {
            pattern: 'Submitted',
            unit: 'word',
          },
        };
        const prevTarget = {
          value: 'Your',
          indices: {
            pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 0,
          },
          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].words[0].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({ value: ''});
      });
      test('returns falsy target value when phrase count exceeds the matching phrases found', () => {
        const parser = {
          count: 2,
          method: 'below',
          target: {
            pattern: 'Submitted on 01/01/2000',
            unit: 'phrase',
          },
        };
        const prevTarget = {
          value: 'Your',
          indices: {
            pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 0,
          },
          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].words[0].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({ value: '' });
      });
      test('returns falsy target value when no matching words found within word count', () => {
        const parser = {
          count: 1,
          method: 'below',
          target: {
            pattern: 'Payable',
            unit: 'word',
          },
        };
        const prevTarget = {
          value: 'Your',
          indices: {
            pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 0,
          },
          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].words[0].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({ value: '' });
      });
      test('returns falsy target value when no matching phrases found within phrase count', () => {
        const parser = {
          count: 1,
          method: 'below',
          target: {
            pattern: 'Payable to',
            unit: 'phrase',
          },
        };
        const prevTarget = {
          value: 'Your',
          indices: {
            pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 0,
          },
          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].words[0].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({ value: '' });
      });
      test('gets correct phrase when the previous target is a word', () => {
        const parser = {
          count: 3,
          method: 'below',
          target: {
            pattern: '.+',
            unit: 'phrase',
          },
        };
        const prevTarget = {
          value: 'Company',
          indices: {
            pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].words[1].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 3, pageEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          value: '(123) 456-7890',
          normalizedVertices: [...lineList.pages[0].lines[3].phrases[0].boundingBox.normalizedVertices],
          unitType: 'phrase',
          segments: null
        });
      });
      test('gets correct word when the previous target is a word', () => {
        const parser = {
          count: 3,
          method: 'below',
          target: {
            pattern: '.+',
            unit: 'word',
          },
        };
        const prevTarget = {
          value: 'Company',
          indices: {
            pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].words[1].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 3, pageEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          value: '456-7890',
          normalizedVertices: [...lineList.pages[0].lines[3].phrases[0].words[1].boundingBox.normalizedVertices],
          unitType: 'word',
        });
      });
      test('gets correct phrase when the previous target is a phrase', () => {
        const parser = {
          count: 2,
          method: 'below',
          target: {
            pattern: '\\D+ \\D+',
            unit: 'phrase',
          },
        };
        const prevTarget = {
          value: 'Your Company',
          indices: {
            pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 8, pageEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          value: 'Company name',
          normalizedVertices: [...lineList.pages[0].lines[8].phrases[0].boundingBox.normalizedVertices],
          unitType: 'phrase',
          segments: null
        });
      });
      test('gets correct word when the previous target is a phrase', () => {
        const parser = {
          count: 2,
          method: 'below',
          target: {
            pattern: '\\D{6}',
            unit: 'word',
          },
        };
        const prevTarget = {
          value: 'Your Company',
          indices: {
            pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 1,
          },
          normalizedVertices: [...lineList.pages[0].lines[0].phrases[0].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 9, pageEnd: 0, phraseEnd: 0, wordEnd: 0,
          },
          value: 'Street',
          normalizedVertices: [...lineList.pages[0].lines[9].phrases[0].words[0].boundingBox.normalizedVertices],
          unitType: 'word',
        });
      });
      test('gets the first phrase within a group of phrases that exist directly beneath previous target', () => {
        const parser = {
          count: 5,
          method: 'below',
          target: {
            pattern: '.+',
            unit: 'phrase',
          },
        };
        const prevTarget = {
          value: 'Expense Report',
          indices: {
            pageEnd: 1, lineEnd: 4, phraseEnd: 0, wordEnd: 1,
          },
          normalizedVertices: [...lineList.pages[1].lines[4].phrases[0].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 9, pageEnd: 1, phraseEnd: 0, wordEnd: 1,
          },
          value: 'Manager name',
          normalizedVertices: [...lineList.pages[1].lines[9].phrases[0].boundingBox.normalizedVertices],
          unitType: 'phrase',
          segments: null
        });
      });
      test('gets the first word within a group of words that exist directly beneath previous target', () => {
        const parser = {
          count: 3,
          method: 'below',
          target: {
            pattern: '.+',
            unit: 'word',
          },
        };
        const prevTarget = {
          value: 'Expense Report',
          indices: {
            pageEnd: 1, lineEnd: 4, phraseEnd: 0, wordEnd: 1,
          },
          normalizedVertices: [...lineList.pages[1].lines[4].phrases[0].boundingBox.normalizedVertices],
        };
        const receivedTarget = getParserTarget(lineList, parser, prevTarget);
        expect(receivedTarget).toStrictEqual({
          indices: {
            lineEnd: 7, pageEnd: 1, phraseEnd: 0, wordEnd: 0,
          },
          value: 'Employee',
          normalizedVertices: [...lineList.pages[1].lines[7].phrases[0].words[0].boundingBox.normalizedVertices],
          unitType: 'word',
        });
      });
    });
  });
});

describe('combining sequential parsers to get target text from document', () => {
  test('combining two parsers, first example', () => {
    const parsers = [
      {
        count: 4,
        method: 'after',
        target: {
          pattern: '.+',
          unit: 'phrase',
        },
      },
      {
        count: 3,
        method: 'below',
        target: {
          pattern: '.+',
          unit: 'phrase',
        },
      },   
    ]
    const target = getParsersTarget(lineList, parsers)
    expect(target.value).toBe('Invoice for')   
    expect(target.indices).toStrictEqual({"lineEnd": 6, "pageEnd": 0, "phraseEnd": 0, "wordEnd": 1}) 
  });
  test('combining two parsers, second example', () => {
    const parsers = [
      {
        count: 6,
        method: 'below',
        target: {
          pattern: '.+',
          unit: 'word',
        },
      },
      {
        count: 2,
        method: 'after',
        target: {
          pattern: '.+',
          unit: 'word',
        },
      },   
    ]
    const target = getParsersTarget(lineList, parsers)
    expect(target.value).toBe('01/01/2000')   
    expect(target.indices).toStrictEqual({"lineEnd": 5, "pageEnd": 0, "phraseEnd": 0, "wordEnd": 2}) 
  });
});



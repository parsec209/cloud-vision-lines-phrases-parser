const getParserTarget = (lineList, parser, prevTarget) => {
  /* eslint-disable no-plusplus, no-unused-vars*/ 
  const { count, method, target: { pattern, unit } } = parser;
  const re = new RegExp(`^${pattern}$`);
  const { 
    normalizedVertices: [{ x: xLeftPrevious }, { x: xRightPrevious }], 
    value: previousValue 
  } = prevTarget;
  let {
    indices: {
      pageEnd, lineEnd, phraseEnd, wordEnd,
    },
  } = prevTarget;
  let isFirstIter = true;
  let valueMatchCount = 0;
  let target = null;

  for (let i = pageEnd; i < lineList.pages.length; i++) {
    const page = lineList.pages[i];
    for (let j = lineEnd; j < page.lines.length; j++) {
      const line = page.lines[j];
      let isNewLine = true;
      for (let k = phraseEnd; k < line.phrases.length; k++) {
        const phrase = line.phrases[k];
        for (let l = wordEnd; l < phrase.words.length; l++) {
          const word = phrase.words[l];

          if (!isFirstIter || !previousValue) {
            if (unit === 'phrase') {    
              const pN = phrase.boundingBox.normalizedVertices  
              const p = [
                {x: pN[0].x, y: pN[0].y}, 
                {x: pN[1].x, y: pN[1].y}, 
                {x: pN[2].x, y: pN[2].y}, 
                {x: pN[3].x, y: pN[3].y}
              ]
              target = {
                value: phrase.text,
                normalizedVertices: p,
                indices: {
                  pageEnd: i, lineEnd: j, phraseEnd: k, wordEnd: phrase.words.length - 1,
                },
                unitType: 'phrase',
                segments: null   
              };
              if (l) {  // If previous target word is embedded within the current phrase, phrase is divided into segments.
                const xRightFirstSegment = phrase.words[l - 1].boundingBox.normalizedVertices[1].x
                const xLeftSecondSegment = word.boundingBox.normalizedVertices[0].x
                const textFirstSegment = phrase.text.split(' ', l).join(' ')
                const textSecondSegment = phrase.text.substring(textFirstSegment.length).trimStart()

                target.segments = {
                  first: {
                    normalizedVertices: [
                      {x: p[0].x, y: p[0].y},
                      {x: xRightFirstSegment, y: p[1].y},
                      {x: xRightFirstSegment, y: p[2].y},
                      {x: p[3].x, y: p[3].y }
                    ],
                    text: textFirstSegment 
                  },
                  second: {
                    normalizedVertices: [
                      {x: xLeftSecondSegment, y: p[0].y},
                      {x: p[1].x, y: p[1].y},
                      {x: p[2].x, y: p[2].y},
                      {x: xLeftSecondSegment, y: p[3].y }
                    ],
                    text: textSecondSegment 
                  },
                }

                target.value = textSecondSegment
                p[0].x = xLeftSecondSegment
                p[3].x = xLeftSecondSegment
              }
              if (re.test(phrase.text)) {
                if (method === 'after' || 
                  (method === 'below' && 
                  target.normalizedVertices[1].x > xLeftPrevious && 
                  target.normalizedVertices[0].x < xRightPrevious && 
                  isNewLine)
                ) {
                  valueMatchCount += 1;
                  isNewLine = false;
                  if (valueMatchCount === count) {
                    return target;
                  }
                }
              }
              break;
            } else {
              if (re.test(word.text)) {
                const wN = word.boundingBox.normalizedVertices  
                const w = [
                  {x: wN[0].x, y: wN[0].y}, 
                  {x: wN[1].x, y: wN[1].y}, 
                  {x: wN[2].x, y: wN[2].y}, 
                  {x: wN[3].x, y: wN[3].y}
                ]
                target = {
                  value: word.text,
                  normalizedVertices: w,
                  indices: {
                    pageEnd: i, lineEnd: j, phraseEnd: k, wordEnd: l,
                  },
                  unitType: 'word',
                };
                if (method === 'after' || 
                  (method === 'below' && 
                  target.normalizedVertices[1].x > xLeftPrevious && 
                  target.normalizedVertices[0].x < xRightPrevious && 
                  isNewLine)
                ) {
                  valueMatchCount += 1;
                  isNewLine = false;
                  if (valueMatchCount === count) {
                    return target;
                  }
                }
              }
            }
          }
          if (isFirstIter) {
            pageEnd = 0;
            lineEnd = 0;
            phraseEnd = 0;
            wordEnd = 0;
            isFirstIter = false;
          }
        }
      }
    }
  }
  target = { value: '' }
  return target
  
};
  
const getParsersTarget = (lineList, parsers) => {
  let target = {
    value: '',
    indices: {
      pageEnd: 0, lineEnd: 0, phraseEnd: 0, wordEnd: 0,
    },
    normalizedVertices: [{ x: 0 }, { x: 0.9999999 }]
  };
  for (let i = 0; i < parsers.length && target.indices; i++) { // eslint-disable-line no-plusplus
    const parser = parsers[i];
    target = getParserTarget(lineList, parser, target);
  }
  return target
};


module.exports = { getParserTarget, getParsersTarget }





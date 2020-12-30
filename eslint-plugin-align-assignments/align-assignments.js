/**
 * @fileoverview align-assignments
 * @author Lucas Florio
 */
'use strict';

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

const hasRequire   = /require\(/;
const spaceMatcher = /(\s*)((?!=>)(?:\+|-|\*|\/|%|&|\^|\||<<|>>|\*\*|>>>)?=)/;

module.exports = {
  meta: {
    fixable: 'code'
  },

  create(context) {
    const { options }  = context;
    const requiresOnly = options && options.length > 0 && options[0].requiresOnly;
    const sourceCode   = context.getSourceCode();
    const groups       = [];
    let previousNode;

    return {
      VariableDeclaration(node) {
        if(previousNode && previousNode?.type === 'ExportNamedDeclaration') {
          return;
        }
        const source = sourceCode.getText(node);
        if (requiresOnly && !hasRequire.test(source)) {
          return;
        }

        addNode(node, node);
      },

      ExpressionStatement(node) {
        // Does it contain an assignment expression?
        const hasAssignmentExpression = node.expression.type === 'AssignmentExpression';
        if (!hasAssignmentExpression) {
          return;
        }

        addNode(node, node.expression);
      },

      ExportNamedDeclaration(node) {
        const hasVariableDeclaration = node?.declaration?.type === 'VariableDeclaration';
        if(!hasVariableDeclaration) {
          return;
        }
  
        addNode(node, node);
      },
      ClassProperty(node) {
        if(node.value == null) {
          return;
        }
        addNode(node, node);
      },
      'Program:exit': checkAll
    };

    function checkAll() {
      groups.forEach(check);
    }

    function isAssignmentExpression(node) {
      return node.type === 'AssignmentExpression';
    }

    function addNode(groupNode, node) {
      if (shouldStartNewGroup(groupNode)) {
        groups.push([node]);
      } else {
        getLast(groups).push(node);
      }

      previousNode = groupNode;
    }

    function shouldStartNewGroup(node) {
      // first line of all
      if (!previousNode) {
        return true;
      }
      
      // switching parent nodes
      if(node.parent !== previousNode.parent) {
        return true;
      }

      // If previous node was a for and included the declarations, new group
      if (previousNode.parent.type === 'ForStatement' && previousNode.declarations) {
        return true;
      }

      // previous line was blank.
      const lineOfNode = sourceCode.getFirstToken(node).loc.start.line;
      const lineOfPrev = sourceCode.getLastToken(previousNode).loc.start.line;
      return lineOfNode - lineOfPrev !== 1;
    }

    function check(group) {
      const maxPos = getMaxPos(group);
      if (!areAligned(maxPos, group)) {
        context.report({
          loc: {
            start: group[0].loc.start,
            end: getLast(group).loc.end
          },
          message: 'This group of assignments is not aligned',
          fix: (fixer) => {
            const fixings = group.map(function (node) {
              const tokens          = sourceCode.getTokens(node);
              const firstToken      = tokens[0];
              const assignmentToken = tokens.find((token) =>
                ['=', '+=', '-=', '*=', '/=', '%=', '&=', '^=', '|=', '<<=', '>>=', '**=', '>>>='].includes(token.value)
              );
              const line            = sourceCode.getText(node);
              const lineIsAligned   = line.charAt(maxPos) === '=';
              if (lineIsAligned || !assignmentToken || isMultiline(firstToken, assignmentToken)) {
                return fixer.replaceText(node, line);
              } else {
                // source line may include spaces, we need to accomodate for that.
                const spacePrefix    = firstToken.loc.start.column;
                const startDelimiter = assignmentToken.loc.start.column - spacePrefix;
                const endDelimiter   = assignmentToken.loc.end.column - spacePrefix;
                const start          = line.slice(0, startDelimiter).replace(/\s+$/m, '');
                const ending         = line.slice(endDelimiter).replace(/^\s+/m, '');
                const spacesRequired = maxPos - start.length - assignmentToken.value.length + 1;
                const spaces         = ' '.repeat(spacesRequired);
                const fixedText      = `${start}${spaces}${assignmentToken.value} ${ending}`;
                return fixer.replaceText(node, fixedText);
              }
            });

            return fixings.filter((fix) => fix);
          }
        });
      }
    }

    function isMultiline(firstToken, assignmentToken) {
      return firstToken.loc.start.line !== assignmentToken.loc.start.line;
    }

    function findAssigment(node) {
      const prefix   = getPrefix(node);
      const source   = sourceCode.getText(node);
      const match    = source.substr(prefix).match(spaceMatcher);
      const position = match ? match.index + prefix + match[2].length : null;
      return position;
    }

    function getPrefix(node) {
      const nodeBefore = isAssignmentExpression(node)
        ? node.left
        : node?.type === 'ExportNamedDeclaration'
          ? node.declaration.declarations.find((dcl) => dcl.type === 'VariableDeclarator').id
          : node?.type === 'ClassProperty'
            ? node.key
            : node.declarations.find((dcl) => dcl.type === 'VariableDeclarator').id;

      const prefix = nodeBefore.loc.end.column - nodeBefore.loc.start.column;
      return prefix;
    }

    function areAligned(maxPos, nodes) {
      return nodes
        .filter(assignmentOnFirstLine)
        .map((node) => sourceCode.getText(node))
        .every((source) => {
          return source.charAt(maxPos) === '='
        });
    }

    function getMaxPos(nodes) {
      const maxPos = nodes
        .filter(assignmentOnFirstLine)
        .map(findAssigment)
        .reduce((last, current) => Math.max(last, current), []);
      return maxPos;
    }

    function assignmentOnFirstLine(node) {
      if (isAssignmentExpression(node)) {
        const onFirstLine = node.left.loc.start.line === node.right.loc.start.line;
        return onFirstLine;
      } else {
        const source = sourceCode.getText(node);
        const lines  = source.split('\n');
        return lines[0].includes('=');
      }
    }

    function getLast(ary) {
      return ary[ary.length - 1];
    }
  }
};
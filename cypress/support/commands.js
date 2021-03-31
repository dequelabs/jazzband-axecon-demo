// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
Cypress.Commands.add('accessibleName', { prevSubject: 'element' }, $subject => {
  cy.window({ log: false }).then(win => {
    win.axe._tree = win.axe.utils.getFlattenedTree(win.document.body);
    return win.axe.commons.text.accessibleText($subject[0]);
  });
});

Cypress.Commands.add(
  'findByAccessibleName',
  { prevSubject: 'optional' },
  ($subject, name) => {
    cy.window({ log: false }).then(win => {
      const els = $subject
        ? Array.from($subject)
        : Array.from(win.document.body.querySelectorAll('*'));
      win.axe._tree = win.axe.utils.getFlattenedTree(win.document.body);
      const text = name instanceof RegExp ? name : new RegExp(name, 'im');
      return els.find(el =>
        win.axe.commons.text.accessibleText(el).match(text)
      );
    });
  }
);

// @see https://github.com/cypress-io/cypress/issues/299
const ally = require('ally.js');
const tabSequence = ally.query.tabsequence;
const tab = (el, shiftKey) => {
  const win = el.ownerDocument.defaultView;
  const keyboardEvent = new win.KeyboardEvent('keydown', {
    shiftKey,
    key: 'Tab',
    code: 'Tab',
    keyCode: 9,
    which: 9
  });
  el.dispatchEvent(keyboardEvent);
};

Cypress.Commands.add(
  'tab',
  { prevSubject: 'optional' },
  ($subject, shiftKey = false) => {
    const el = $subject ? $subject[0] : cy.state('window').document.body;
    const doc = el.ownerDocument;

    return Cypress.Promise.try(() => {
      // fire any JS handler first
      tab(el, shiftKey);
      if (doc.activeElement === el) {
        const tabbable = tabSequence({
          strategy: 'quick',
          includeContext: false,
          includeOnlyTabbable: true,
          context: doc.documentElement
        });
        const currentIndex = tabbable.indexOf(el);
        const nextIndex = shiftKey ? currentIndex - 1 : currentIndex + 1;
        cy.now('focus', cy.$$(tabbable[nextIndex % tabbable.length]));
      }
    });
  }
);

Cypress.Commands.add('trapsFocus', { prevSubject: 'element' }, $subject => {
  const context = $subject[0];
  const doc = context.ownerDocument;
  const tabbable = tabSequence({
    strategy: 'quick',
    includeContext: true,
    includeOnlyTabbable: true,
    context
  });
  tabbable.forEach(el => {
    tab(el);
    expect(context.contains(doc.activeElement)).to.be.true;
    tab(el, true);
    expect(context.contains(doc.activeElement)).to.be.true;
  });
});

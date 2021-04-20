/* eslint-disable @typescript-eslint/no-var-requires */
import * as A from '@principia/base/Array'
import * as I from '@principia/base/IO'
import * as O from '@principia/base/Option'
import { pipe } from '@principia/prelude/function'
import { isRunnableSpec } from '@principia/test/RunnableSpec'
import { TestArgs } from '@principia/test/TestArgs'
import path from 'path'
import yargs from 'yargs'

import { glob } from './util'

require('ts-node').register()

const argv = yargs(process.argv.slice(2))
  .options({
    path: { string: true },
    tests: { alias: 't', array: true, string: true },
    tags: { array: true, string: true },
    policy: { string: true }
  })
  .help().argv

const testArgs = new TestArgs(argv.tests || [], argv.tags || [], O.fromNullable(argv.policy))

const program = pipe(
  glob(argv.path ?? './**/test/*Spec.ts'),
  I.map(
    A.map((s) => {
      const parsed = path.parse(s)
      return `${process.cwd()}/${parsed.dir}/${parsed.name}`
    })
  ),
  I.bind(I.foreach((path) => I.effect(() => require(path).default))),
  I.bind(I.foreach((test) => (isRunnableSpec(test) ? I.effectTotal(() => test.main(testArgs)) : I.unit())))
)

I.run_(program)
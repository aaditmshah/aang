# [v2.0.0-alpha.17](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.16...v2.0.0-alpha.17) (2024-02-24)

## ✨ New Features

- [`d6a2baa`](https://github.com/aaditmshah/aang/commit/d6a2baa) Add the &#x60;Ordering&#x60; type, functions, and tests
- [`fc94760`](https://github.com/aaditmshah/aang/commit/fc94760) Add the &#x60;Order&#x60; class, implementations, and tests
- [`2672f9f`](https://github.com/aaditmshah/aang/commit/2672f9f) Add the &#x60;OptionSetoid&#x60; and &#x60;OptionOrder&#x60; classes

# [v2.0.0-alpha.16](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.15...v2.0.0-alpha.16) (2024-02-23)

## ✨ New Features

- [`d6b2d1b`](https://github.com/aaditmshah/aang/commit/d6b2d1b) Add type predicate overloads for &#x60;Option&#x60; methods
- [`4c63229`](https://github.com/aaditmshah/aang/commit/4c63229) Add a &#x60;toString&#x60; method to &#x60;OptionTrait&#x60;

# [v2.0.0-alpha.15](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.14...v2.0.0-alpha.15) (2024-02-19)

## ✨ New Features

- [`7d8f183`](https://github.com/aaditmshah/aang/commit/7d8f183) Add the &#x60;isSomeAnd&#x60; and &#x60;isNoneOr&#x60; methods
- [`a8c0186`](https://github.com/aaditmshah/aang/commit/a8c0186) Add the &#x60;of&#x60; static method to &#x60;Some&#x60; and &#x60;Result&#x60;
- [`01c7d5f`](https://github.com/aaditmshah/aang/commit/01c7d5f) Add and export &#x60;Pair&#x60; data type and unit tests
- [`da2d8f1`](https://github.com/aaditmshah/aang/commit/da2d8f1) Add more methods to the &#x60;OptionTrait&#x60; class

# [v2.0.0-alpha.14](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.13...v2.0.0-alpha.14) (2024-02-15)

## ✨ New Features

- [`b9d1800`](https://github.com/aaditmshah/aang/commit/b9d1800) Add an &#x60;id&#x60; function and use it in the tests

## 💥 Breaking Changes

- [`bde9d55`](https://github.com/aaditmshah/aang/commit/bde9d55) Rename &#x60;Result&#x60; constructors to &#x60;Okay&#x60; and &#x60;Fail&#x60;

# [v2.0.0-alpha.13](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.12...v2.0.0-alpha.13) (2024-02-10)

## 💥 Breaking Changes

- [`e9339d2`](https://github.com/aaditmshah/aang/commit/e9339d2) Remove thunks and expressions from the code base

# [v2.0.0-alpha.12](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.11...v2.0.0-alpha.12) (2024-02-06)

## ✨ New Features

- [`7c12fa8`](https://github.com/aaditmshah/aang/commit/7c12fa8) Make the &#x60;None&#x60; class constructor &#x60;public&#x60;

## 💥 Breaking Changes

- [`34c9fe0`](https://github.com/aaditmshah/aang/commit/34c9fe0) Add a new &#x60;Thunk&#x60; class and remove &#x60;NonFunction&#x60;

# [v2.0.0-alpha.11](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.10...v2.0.0-alpha.11) (2024-02-01)

## 💥 Breaking Changes

- [`d8260d8`](https://github.com/aaditmshah/aang/commit/d8260d8) Make the &#x60;Option&#x60; and &#x60;Result&#x60; constructors lazy

# [v2.0.0-alpha.10](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.9...v2.0.0-alpha.10) (2024-01-31)

## ✨ New Features

- [`5b5c01a`](https://github.com/aaditmshah/aang/commit/5b5c01a) Add &#x60;Expression&#x60; type and the &#x60;evaluate&#x60; function
- [`68fd8f5`](https://github.com/aaditmshah/aang/commit/68fd8f5) Make &#x60;Option&#x60; methods work with expression values
- [`8b351ac`](https://github.com/aaditmshah/aang/commit/8b351ac) Add the &#x60;isThunk&#x60; and &#x60;isNonFunction&#x60; type guards
- [`1db14e5`](https://github.com/aaditmshah/aang/commit/1db14e5) Move all fast-check arbitraries to separate file

# [v2.0.0-alpha.9](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.8...v2.0.0-alpha.9) (2024-01-30)

## ✨ New Features

- [`ce7cbaf`](https://github.com/aaditmshah/aang/commit/ce7cbaf) Add &#x60;[Symbol.iterator]&#x60; to &#x60;OptionMethods&#x60;

# [v2.0.0-alpha.8](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.7...v2.0.0-alpha.8) (2024-01-30)

## ✨ New Features

- [`391beaa`](https://github.com/aaditmshah/aang/commit/391beaa) Add the &#x60;toResult&#x60; method to &#x60;OptionMethods&#x60;

# [v2.0.0-alpha.7](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.6...v2.0.0-alpha.7) (2024-01-30)

## 💥 Breaking Changes

- [`21bc737`](https://github.com/aaditmshah/aang/commit/21bc737) Export classes instead of the data constructors

# [v2.0.0-alpha.6](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.5...v2.0.0-alpha.6) (2024-01-30)

## ✨ New Features

- [`391e6ef`](https://github.com/aaditmshah/aang/commit/391e6ef) Add the &#x60;Result&#x60; type and its data constructors

# [v2.0.0-alpha.5](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.4...v2.0.0-alpha.5) (2024-01-30)

## 💥 Breaking Changes

- [`7f82535`](https://github.com/aaditmshah/aang/commit/7f82535) Rename &#x60;safeExtractFrom&#x60; and overwrite &#x60;safeExtract&#x60;

# [v2.0.0-alpha.4](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.3...v2.0.0-alpha.4) (2024-01-30)

## ✨ New Features

- [`018b2eb`](https://github.com/aaditmshah/aang/commit/018b2eb) Add the &#x60;flatMap&#x60; and &#x60;filter&#x60; Option methods

# [v2.0.0-alpha.3](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.2...v2.0.0-alpha.3) (2024-01-29)

## ✨ New Features

- [`4c3a710`](https://github.com/aaditmshah/aang/commit/4c3a710) Add &#x60;safeExtract&#x60; and &#x60;safeExtractFrom&#x60; methods

# [v2.0.0-alpha.2](https://github.com/aaditmshah/aang/compare/v2.0.0-alpha.1...v2.0.0-alpha.2) (2024-01-29)

## 💥 Breaking Changes

- [`57c8b3c`](https://github.com/aaditmshah/aang/commit/57c8b3c) Add a distinction between exceptions and errors

# [v2.0.0-alpha.1](https://github.com/aaditmshah/aang/compare/v1.1.0-alpha.2...v2.0.0-alpha.1) (2024-01-25)

## 💥 Breaking Changes

- [`2b8bdad`](https://github.com/aaditmshah/aang/commit/2b8bdad) Bump the major version number

# [v1.1.0-alpha.2](https://github.com/aaditmshah/aang/compare/v1.1.0-alpha.1...v1.1.0-alpha.2) (2024-01-25)

## ✨ New Features

- [`30625f6`](https://github.com/aaditmshah/aang/commit/30625f6) Export the &#x60;Option&#x60; type and data constructors

# [v1.1.0-alpha.1](https://github.com/aaditmshah/aang/compare/v1.0.0...v1.1.0-alpha.1) (2024-01-25)

## ✨ New Features

- [`c113e48`](https://github.com/aaditmshah/aang/commit/c113e48) Add an abstract &#x60;CustomError&#x60; class
- [`0aca877`](https://github.com/aaditmshah/aang/commit/0aca877) Add the &#x60;Option&#x60; type and its data constructors

# v1.0.0 (2024-01-25)

## ✨ New Features

- [`ecb49ad`](https://github.com/aaditmshah/aang/commit/ecb49ad) Free the boy in the iceberg

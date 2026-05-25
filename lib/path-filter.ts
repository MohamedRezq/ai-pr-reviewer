import micromatch from 'micromatch'

/**
 * Returns true if a file should be reviewed based on include/exclude globs.
 * Empty includes = all files pass (only excludes are applied).
 * Empty excludes = no files are excluded.
 */
export function shouldReviewFile(
  filePath: string,
  includes: string[],
  excludes: string[],
): boolean {
  if (excludes.length > 0 && micromatch.isMatch(filePath, excludes)) return false
  if (includes.length > 0 && !micromatch.isMatch(filePath, includes)) return false
  return true
}

/**
 * Filters a list of file paths based on include/exclude globs.
 */
export function filterFiles(
  filePaths: string[],
  includes: string[],
  excludes: string[],
): string[] {
  return filePaths.filter((p) => shouldReviewFile(p, includes, excludes))
}

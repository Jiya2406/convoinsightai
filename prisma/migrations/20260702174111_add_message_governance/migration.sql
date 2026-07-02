-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "governanceReasons" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "governanceStatus" "GovernanceStatus" NOT NULL DEFAULT 'PASS';

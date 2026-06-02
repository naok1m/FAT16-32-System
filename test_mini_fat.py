import os
import tempfile
import unittest

from mini_fat import EOC, FileSystemError, MiniFAT


class MiniFATTests(unittest.TestCase):
    def test_fat16_file_lifecycle(self):
        fs = MiniFAT.create("FAT16", total_clusters=16, cluster_size=4)

        fs.mkdir("/docs")
        fs.write_file("/docs/nota.txt", "abcdef")
        self.assertEqual(fs.read_file("/docs/nota.txt"), "abcdef")

        listing = "\n".join(fs.list_dir("/docs"))
        self.assertIn("nota.txt", listing)
        self.assertIn("clusters=2", listing)

        fs.append_file("/docs/nota.txt", "ghi")
        self.assertEqual(fs.read_file("/docs/nota.txt"), "abcdefghi")

        replacements = fs.replace_in_file("/docs/nota.txt", "def", "FAT")
        self.assertEqual(replacements, 1)
        self.assertEqual(fs.read_file("/docs/nota.txt"), "abcFATghi")

        fs.rename("/docs/nota.txt", "aula.txt")
        fs.move("/docs/aula.txt", "/aula.txt")
        self.assertEqual(fs.read_file("/aula.txt"), "abcFATghi")

        fs.remove("/aula.txt")
        self.assertEqual(fs.list_dir("/"), ["DIR  docs                     cluster=2"])

    def test_fat32_root_uses_data_cluster(self):
        fs = MiniFAT.create("FAT32", total_clusters=16, cluster_size=8)

        self.assertEqual(fs.metadata["root_cluster"], 2)
        self.assertEqual(fs.fat[2], EOC)
        self.assertIn("cluster 2", "\n".join(fs.info()))

    def test_existing_file_requires_overwrite(self):
        fs = MiniFAT.create("FAT16", total_clusters=16, cluster_size=8)

        fs.write_file("/a.txt", "um")
        with self.assertRaises(FileSystemError):
            fs.write_file("/a.txt", "dois")

        fs.write_file("/a.txt", "dois", overwrite=True)
        self.assertEqual(fs.read_file("/a.txt"), "dois")

    def test_save_and_load_image(self):
        fs = MiniFAT.create("FAT32", total_clusters=16, cluster_size=8)
        fs.write_file("/ola.txt", "conteudo")

        with tempfile.TemporaryDirectory() as tmpdir:
            image_path = os.path.join(tmpdir, "fat.json")
            fs.save(image_path)
            loaded = MiniFAT.load(image_path)

        self.assertEqual(loaded.read_file("/ola.txt"), "conteudo")


if __name__ == "__main__":
    unittest.main()
